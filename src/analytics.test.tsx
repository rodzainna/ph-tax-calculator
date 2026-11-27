// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'
import { CONSENT_STORAGE_KEY, TAG_SCRIPT_ID } from '@/lib/consent.ts'

// The site as it is built with a Google tag ID. privacyClaims.test.tsx covers the site without one.
vi.mock('@/config.ts', async (original) => ({
  ...(await original<typeof import('@/config.ts')>()),
  GOOGLE_TAG_ID: 'GTM-TEST',
  ANALYTICS_ENABLED: true,
}))

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  delete window.dataLayer
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
const tag = () => document.getElementById(TAG_SCRIPT_ID)
const question = () => screen.queryByRole('complementary', { name: 'Analytics choice' })
const button = (name: string) => screen.getByRole('button', { name })
const reopenButton = () => button('Analytics choice')
const lastConsent = () =>
  (window.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter(([command]) => command === 'consent')
    .at(-1)

describe('before an answer', () => {
  it('asks, loads nothing and stores nothing, however much the calculator is used', async () => {
    const user = userEvent.setup()
    renderAt()
    expect(question()).not.toBeNull()
    await user.type(screen.getByLabelText('Basic salary per month'), '35000')
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Annual' }))
    expect(tag()).toBeNull()
    expect(window.dataLayer).toBeUndefined()
    expect(Object.keys(localStorage)).toEqual([])
    expect(document.cookie).toBe('')
  })

  it('leaves the keyboard in the salary field on a first visit', () => {
    renderAt()
    expect(document.activeElement).toBe(screen.getByLabelText('Basic salary per month'))
  })
})

describe('the answer', () => {
  it('Accept loads the tag, remembers it and removes the question', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(button('Accept'))
    expect(tag()).not.toBeNull()
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
    expect(question()).toBeNull()
  })

  it('Decline loads nothing, remembers it and removes the question', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(button('Decline'))
    expect(tag()).toBeNull()
    expect(window.dataLayer).toBeUndefined()
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    expect(question()).toBeNull()
  })

  it.each([
    ['granted', true],
    ['denied', false],
  ])('is not asked again on a later visit (%s)', (saved, loads) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, saved)
    renderAt()
    expect(question()).toBeNull()
    expect(tag() !== null).toBe(loads)
  })
})

describe('changing the answer from the footer', () => {
  it('moves the keyboard to the question, then back to the footer button', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
    const user = userEvent.setup()
    renderAt()
    await user.click(reopenButton())
    expect(document.activeElement).toBe(question())
    await user.click(button('Decline'))
    expect(document.activeElement).toBe(reopenButton())
  })

  it('stops analytics on Decline and starts it again on Accept', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    const user = userEvent.setup()
    renderAt()
    await user.click(reopenButton())
    await user.click(button('Decline'))
    expect(lastConsent()).toEqual(['consent', 'update', { analytics_storage: 'denied' }])
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    await user.click(reopenButton())
    await user.click(button('Accept'))
    expect(lastConsent()).toEqual(['consent', 'update', { analytics_storage: 'granted' }])
    expect(document.querySelectorAll(`#${TAG_SCRIPT_ID}`)).toHaveLength(1)
  })
})

describe('the privacy policy with analytics', () => {
  it('says analytics waits for consent, and no longer says there is none', () => {
    renderAt('/privacy')
    const text = screen.getByRole('main').textContent
    expect(text).toContain('Google Analytics loads only if you accept it.')
    for (const measured of [
      'first visit',
      'pages you view',
      'scroll near the bottom',
      'links you click to other sites',
    ])
      expect(text, measured).toContain(measured)
    expect(text).toContain('files you open from a link')
    expect(text).toContain('searches, video plays and the use of forms')
    expect(text).toContain('If you decline, nothing from Google loads.')
    expect(text).toContain('does not make your browser contact any other company, unless you accept analytics')
    expect(text).toContain('You can withdraw your consent to analytics')
    expect(text).not.toContain('has no analytics')
    expect(text).not.toContain('does not use analytics')
  })
})
