// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'

// jsdom does not scroll, so scrollTo is stood in for.
beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('the footer links', () => {
  it('lead to Privacy and Terms, and both pages exist', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const footer = screen.getByRole('navigation', { name: 'Footer' })
    expect(
      within(footer)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/privacy', '/terms'])
    for (const [link, title] of [
      ['Privacy', 'Privacy Policy'],
      ['Terms', 'Terms of Use'],
    ]) {
      await user.click(within(footer).getByRole('link', { name: link }))
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title)
    }
  })

  it.each(['/privacy', '/terms'])('every link inside %s that stays on the site opens a real page', async (path) => {
    const user = userEvent.setup()
    renderAt(path)
    expect(screen.queryByText('That page does not exist')).toBeNull()
    const inside = within(screen.getByRole('main'))
      .getAllByRole('link')
      .map((a) => a.getAttribute('href')!)
      .filter((href) => href.startsWith('/'))
    expect(inside.length).toBeGreaterThan(0)
    for (const href of inside) {
      cleanup()
      renderAt(path)
      await user.click(
        within(screen.getByRole('main'))
          .getAllByRole('link')
          .find((a) => a.getAttribute('href') === href)!,
      )
      expect(screen.queryByText('That page does not exist'), href).toBeNull()
    }
  })
})

function BackButton() {
  const navigate = useNavigate()
  return <button onClick={() => void navigate(-1)}>test: back</button>
}

describe('opening a page from a link', () => {
  const footerLink = (name: string) =>
    within(screen.getByRole('navigation', { name: 'Footer' })).getByRole('link', { name })

  it('starts at the top', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(window.scrollTo).not.toHaveBeenCalled()
    await user.click(footerLink('Privacy'))
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('goes to the top every time, even on the page you are already on', async () => {
    const user = userEvent.setup()
    renderAt('/')
    for (let use = 1; use <= 4; use++) {
      await user.click(footerLink('Terms'))
      expect(window.scrollTo, `use ${use}`).toHaveBeenCalledTimes(use)
    }
  })

  it('moves the keyboard from the footer to the page, so Tab does not jump back down', async () => {
    const user = userEvent.setup()
    renderAt('/')
    footerLink('Privacy').focus()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(screen.getByRole('main'))
    await user.tab()
    expect(screen.getByRole('main').contains(document.activeElement)).toBe(true)
  })

  it('moves the keyboard to the page when the click did not focus the link, as in Safari', () => {
    renderAt('/')
    // fireEvent clicks without moving the focus, which is what Safari does for a link.
    fireEvent.click(footerLink('Privacy'))
    expect(document.activeElement).toBe(screen.getByRole('main'))
  })

  it('keeps the page area unfocusable, so clicking its text does not move where Tab starts', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(screen.getByRole('main').hasAttribute('tabindex')).toBe(false)
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Annual' }))
    expect(screen.getByRole('main').hasAttribute('tabindex')).toBe(false)
  })

  it.each([
    ['the focus moves on', () => (document.activeElement as HTMLElement).blur()],
    ['something in the page is pressed', () => fireEvent.pointerDown(screen.getByRole('heading', { level: 1 }))],
  ])('stops the page area being focusable once %s', async (_, move) => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(footerLink('Privacy'))
    const main = screen.getByRole('main')
    expect(document.activeElement).toBe(main)
    expect(main.getAttribute('tabindex')).toBe('-1')
    move()
    expect(main.hasAttribute('tabindex')).toBe(false)
  })

  it('leaves the focus on a header link, which stays in view', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const annual = within(screen.getByRole('banner')).getByRole('link', { name: 'Annual' })
    await user.click(annual)
    expect(document.activeElement).toBe(annual)
  })

  it('leaves the position to the browser on Back', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <App />
        <BackButton />
      </MemoryRouter>,
    )
    await user.click(footerLink('Privacy'))
    vi.mocked(window.scrollTo).mockClear()
    await user.click(screen.getByRole('button', { name: 'test: back' }))
    expect(screen.queryByRole('heading', { name: 'Privacy Policy' })).toBeNull()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
