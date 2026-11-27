// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'
import { CONSENT_STORAGE_KEY, forgetUse, TAG_SCRIPT_ID } from '@/lib/consent.ts'

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
  forgetUse()
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

describe('an answer that changes while the tab is open', () => {
  // A browser sends `storage` to the other open tabs, after the new value is already saved.
  const changedElsewhere = (value: string | null, key: string | null = CONSENT_STORAGE_KEY) =>
    act(() => {
      if (value === null) localStorage.clear()
      else localStorage.setItem(CONSENT_STORAGE_KEY, value)
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }))
    })

  it('stops analytics here when it is declined in another tab', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    renderAt()
    changedElsewhere('denied')
    expect(lastConsent()).toEqual(['consent', 'update', { analytics_storage: 'denied' }])
    expect(question()).toBeNull()
  })

  it('stops analytics and asks again when the site storage is cleared', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    renderAt()
    changedElsewhere(null, null)
    expect(lastConsent()).toEqual(['consent', 'update', { analytics_storage: 'denied' }])
    expect(question()).not.toBeNull()
  })

  it.each([
    ['granted', true],
    ['denied', false],
  ])('closes the open question when another tab answers %s', (answer, loads) => {
    renderAt()
    changedElsewhere(answer)
    expect(question()).toBeNull()
    expect(tag() !== null).toBe(loads)
  })

  it('ignores other things the site saves', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    renderAt()
    const before = lastConsent()
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: 'ph-tax-theme', newValue: 'dark' })))
    expect(lastConsent()).toEqual(before)
  })

  it.each([
    [true, ['consent', 'update', { analytics_storage: 'denied' }]],
    [false, ['consent', 'default', expect.anything()]],
  ])('re-reads it when a page comes back from the back/forward cache (persisted: %s)', (persisted, last) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    renderAt()
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
    act(() => void window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted })))
    expect(lastConsent()).toEqual(last)
  })
})

describe('knowing whether the calculators are used', () => {
  const events = () =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter(([command]) => command === 'event')
  const salary = () => screen.getByLabelText('Basic salary per month')

  it('counts nothing for a visit that only looks around', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    const user = userEvent.setup()
    renderAt()
    for (const name of [/Annual/, /About/, /Monthly/])
      await user.click(within(screen.getByRole('banner')).getByRole('link', { name }))
    expect(events()).toEqual([])
  })

  it('counts a monthly estimate once, without the salary', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    const user = userEvent.setup()
    renderAt()
    await user.type(salary(), '31234')
    await user.clear(salary())
    await user.type(salary(), '45678')
    expect(events()).toEqual([['event', 'monthly_estimate']])
    expect(JSON.stringify(events())).not.toMatch(/31234|45678/)
  })

  it('counts an annual estimate', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    const user = userEvent.setup()
    renderAt('/year')
    await user.type(screen.getByLabelText('Basic salary'), '31234')
    expect(events()).toEqual([['event', 'annual_estimate']])
  })

  it('counts an estimate shown before Accept, and nothing after Decline', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.type(salary(), '31234')
    expect(window.dataLayer).toBeUndefined()
    await user.click(button('Accept'))
    expect(events()).toEqual([['event', 'monthly_estimate']])

    cleanup()
    forgetUse()
    localStorage.clear()
    document.head.innerHTML = ''
    delete window.dataLayer
    renderAt()
    await user.type(salary(), '31234')
    await user.click(button('Decline'))
    expect(window.dataLayer).toBeUndefined()
  })
})

describe('the privacy policy with analytics', () => {
  it('says how long things are kept, whom the cookies reach and how to have data deleted', () => {
    renderAt('/privacy')
    const text = screen.getByRole('main').textContent
    for (const said of [
      'your browser does not send them to my other websites',
      'gave you an estimate, with no amounts or anything else you typed',
      'can stay for more than a year unless you clear them',
      'event data for 2 months and user data for 14 months',
      'in every tab where you have this site open',
      'message me with the value of the _ga cookie',
      'up to 63 days to be permanently removed',
    ])
      expect(text, said).toContain(said)
  })

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
