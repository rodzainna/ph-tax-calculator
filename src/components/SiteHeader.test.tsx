// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'

// jsdom does not scroll, so scrollTo is stood in for.
beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const NOT_FOUND = 'That page does not exist'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('the header links', () => {
  it('can tell when a page does not exist', () => {
    renderAt('/no-such-page')
    expect(screen.getByText(NOT_FOUND)).toBeTruthy()
  })

  it('all open a page that exists', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const links = within(screen.getByRole('banner')).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(expect.arrayContaining(['/year', '/about']))
    for (const link of links) {
      await user.click(link)
      expect(screen.queryByText(NOT_FOUND), link.getAttribute('href') ?? '').toBeNull()
    }
  })
})
