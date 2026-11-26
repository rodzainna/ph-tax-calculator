// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { startBox } from './lib/calcBox.ts'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const opener = () => within(screen.getByRole('banner')).getByRole('button', { name: 'Calculator' })
const panel = () => screen.getByRole('group', { name: 'Calculator' })
const closedPanel = () => screen.queryByRole('group', { name: 'Calculator' })
const shown = () => within(panel()).getByRole('status').textContent
const button = (name: string) => within(panel()).getByRole('button', { name })

async function open() {
  const user = userEvent.setup()
  // Strict mode, as in main.tsx: it sets effects up twice, so one that is not cleaned up shows.
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
  await user.click(opener())
  return user
}

describe('the calculator in the app', () => {
  it('opens and closes from the header button', async () => {
    const user = await open()
    expect(opener().getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(panel())
    await user.click(opener())
    expect(closedPanel()).toBeNull()
    expect(opener().getAttribute('aria-pressed')).toBe('false')
  })

  it.each(['Close button', 'Escape'])('gives the focus back to the header button on %s', async (way) => {
    const user = await open()
    if (way === 'Escape') await user.keyboard('{Escape}')
    else await user.click(button('Close calculator'))
    expect(closedPanel()).toBeNull()
    expect(document.activeElement).toBe(opener())
  })

  it('keeps the calculation while closed', async () => {
    const user = await open()
    await user.keyboard('12+30')
    await user.keyboard('{Escape}')
    await user.click(opener())
    await user.keyboard('=')
    expect(shown()).toBe('42')
  })

  it('works from its keys', async () => {
    const user = await open()
    for (const name of ['1', '2', '0', '0', 'Multiply', '3', 'Equals']) await user.click(button(name))
    expect(shown()).toBe('3,600')
    expect(within(panel()).getByText('1,200 × 3 =')).toBeTruthy()
    await user.click(button('7'))
    await user.click(button('8'))
    await user.click(button('Backspace'))
    expect(shown()).toBe('7')
  })

  it('shows a waiting minus sign', async () => {
    const user = await open()
    await user.click(button('Plus or minus'))
    expect(shown()).toBe('-0')
  })

  it('marks the operator that is waiting for a number', async () => {
    const user = await open()
    await user.click(button('5'))
    await user.click(button('Add'))
    expect(button('Add').getAttribute('aria-pressed')).toBe('true')
    expect(button('Multiply').getAttribute('aria-pressed')).toBe('false')
    await user.click(button('2'))
    expect(button('Add').getAttribute('aria-pressed')).toBe('false')
  })

  it.each(['5+3=', '5+3{Enter}'])('takes %s from the keyboard', async (typed) => {
    const user = await open()
    await user.keyboard(typed)
    expect(shown()).toBe('8')
  })

  it('stops the browser from also acting on the keys it takes', async () => {
    await open()
    // fireEvent returns false when the default action was prevented.
    for (const key of ['/', '7', 'Backspace', 'Enter']) expect(fireEvent.keyDown(panel(), { key }), key).toBe(false)
    for (const key of ['Tab', 'a', 'F5']) expect(fireEvent.keyDown(panel(), { key }), key).toBe(true)
    expect(fireEvent.keyDown(panel(), { key: 'c', metaKey: true })).toBe(true)
  })

  it('treats Enter as equals after a key was clicked', async () => {
    const user = await open()
    await user.click(button('5'))
    await user.click(button('Add'))
    await user.click(button('7'))
    await user.keyboard('{Enter}')
    expect(shown()).toBe('12')
  })

  it('takes the focus from a page field when one of its keys is clicked', async () => {
    const user = await open()
    const field = screen.getByRole('textbox', { name: /basic salary/i }) as HTMLInputElement
    await user.click(field)
    await user.click(button('7'))
    await user.keyboard('5')
    expect(shown()).toBe('75')
    expect(field.value).toBe('')
  })

  it('lets Enter and Space press the key that has keyboard focus', async () => {
    const user = await open()
    act(() => button('7').focus())
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(shown()).toBe('77')
  })

  it('reports an error in place of the number', async () => {
    const user = await open()
    await user.keyboard('5/0=')
    expect(shown()).toBe('Cannot divide by zero')
  })

  it('announces the number without the running line', async () => {
    const user = await open()
    await user.keyboard('1200+35')
    expect(shown()).toBe('35')
    expect(within(panel()).getByText('1,200 + 35')).toBeTruthy()
  })

  it('pastes an amount as the next number', async () => {
    const user = await open()
    await user.keyboard('2*')
    await user.paste('₱1,500.25')
    expect(shown()).toBe('1,500.25')
    await user.keyboard('=')
    expect(shown()).toBe('3,000.5')
  })

  it('pastes while a key has the focus', async () => {
    const user = await open()
    act(() => button('7').focus())
    await user.paste('450')
    expect(shown()).toBe('450')
  })

  it('keeps the calculation and says why when a paste is refused', async () => {
    const user = await open()
    await user.keyboard('12+3')
    await user.paste('1,23 or so')
    expect(shown()).toBe('3')
    expect(within(panel()).getByRole('alert').textContent).toBe('Enter an amount up to 15 digits')
    await user.keyboard('=')
    expect(within(panel()).queryByRole('alert')).toBeNull()
    expect(shown()).toBe('15')
  })

  it.each([
    ['the next paste', async (user: ReturnType<typeof userEvent.setup>) => user.paste('8')],
    [
      'coming back to the calculator',
      async (user: ReturnType<typeof userEvent.setup>) => {
        await user.keyboard('{Escape}')
        await user.click(opener())
      },
    ],
  ])('clears the paste message on %s', async (_, recover) => {
    const user = await open()
    await user.paste('nope')
    await recover(user)
    expect(within(panel()).queryByRole('alert')).toBeNull()
  })

  // A browser can send a paste to highlighted text anywhere on the page.
  const pasteAt = (target: Element, text: string) => fireEvent.paste(target, { clipboardData: { getData: () => text } })

  it('takes a paste sent to highlighted text while the focus is on the calculator', async () => {
    await open()
    pasteAt(screen.getByRole('contentinfo'), '₱450.25')
    expect(shown()).toBe('450.25')
  })

  it('takes such a paste while one of its keys has the focus', async () => {
    await open()
    act(() => button('7').focus())
    pasteAt(document.body, '450')
    expect(shown()).toBe('450')
  })

  it('ignores a paste while the focus is elsewhere or after it closes', async () => {
    const user = await open()
    act(() => opener().focus())
    pasteAt(document.body, '450')
    expect(shown()).toBe('0')
    await user.click(opener())
    pasteAt(document.body, '450')
    await user.click(opener())
    expect(shown()).toBe('0')
  })

  it('enters each paste once, so a waiting minus sign is kept', async () => {
    const user = await open()
    await user.keyboard('{Escape}')
    await user.click(opener())
    await user.keyboard('5+')
    await user.click(button('Plus or minus'))
    await user.paste('45')
    expect(shown()).toBe('-45')
  })

  it('leaves a paste into a page field alone', async () => {
    const user = await open()
    const field = screen.getByRole('textbox', { name: /basic/i }) as HTMLInputElement
    await user.click(field)
    await user.paste('25,000')
    expect(field.value).toBe('25,000')
    expect(shown()).toBe('0')
  })

  it('stays in its starting place when the window changes size', async () => {
    vi.stubGlobal('innerWidth', 1440)
    vi.stubGlobal('innerHeight', 900)
    await open()
    const place = () => {
      const { left, top, width, height } = panel().style
      return [left, top, width, height].map(Number.parseFloat)
    }
    const expected = (w: number, h: number) => {
      const box = startBox({ w, h })
      return [box.x, box.y, box.w, box.h]
    }
    expect(place()).toEqual(expected(1440, 900))
    vi.stubGlobal('innerWidth', 375)
    vi.stubGlobal('innerHeight', 500)
    act(() => void window.dispatchEvent(new Event('resize')))
    expect(place()).toEqual(expected(375, 500))
  })
})
