// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '@/App.tsx'
import { THEME_STORAGE_KEY } from '@/lib/theme.ts'

// The privacy policy says what the site stores and sends. These checks fail if the app stops matching it.
const sent = vi.fn()

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', sent)
  vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(sent)
  vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { sendBeacon: sent }))
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('stores nothing and sends nothing while you use it, apart from a theme you choose', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )

  await user.type(screen.getByLabelText('Basic salary per month'), '35000')
  await user.click(screen.getByRole('button', { name: 'Calculator' }))
  await user.keyboard('12+3=')
  await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Annual' }))
  await user.type(screen.getAllByRole('textbox')[0]!, '1000')
  await user.click(screen.getByRole('switch', { name: 'De minimis benefits' }))
  await user.type(screen.getByPlaceholderText('Name'), 'Rice allowance')
  const from = screen.getAllByLabelText('From')[0] as HTMLInputElement
  fireEvent.change(from, { target: { value: '2026-03-15' } })
  expect(screen.getByDisplayValue('Rice allowance')).toBeTruthy()
  expect(from.value).toBe('2026-03-15')

  expect(Object.keys(localStorage)).toEqual([])
  expect(Object.keys(sessionStorage)).toEqual([])
  expect(document.cookie).toBe('')
  expect(sent).not.toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: /Switch to (dark|light) mode/ }))
  expect(Object.keys(localStorage)).toEqual([THEME_STORAGE_KEY])
  expect(document.cookie).toBe('')
  expect(sent).not.toHaveBeenCalled()
})
