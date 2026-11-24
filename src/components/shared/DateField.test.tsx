// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DateField from './DateField.tsx'

afterEach(cleanup)

const show = (props: Partial<React.ComponentProps<typeof DateField>> = {}) => {
  const onCommit = vi.fn()
  const view = render(
    <>
      <label htmlFor="d">Date</label>
      <DateField id="d" value="" onCommit={onCommit} {...props} />
    </>,
  )
  const rerender = (next: Partial<React.ComponentProps<typeof DateField>>) =>
    view.rerender(
      <>
        <label htmlFor="d">Date</label>
        <DateField id="d" value="" onCommit={onCommit} {...props} {...next} />
      </>,
    )
  return { onCommit, rerender }
}

const input = () => screen.getByLabelText('Date') as HTMLInputElement

describe('DateField', () => {
  it('shows the saved date, or the fallback when there is none', () => {
    show({ value: '2026-03-05', fallback: '2026-01-01' })
    expect(input().value).toBe('2026-03-05')
    cleanup()
    show({ value: '', fallback: '2026-01-01' })
    expect(input().value).toBe('2026-01-01')
  })

  it('saves a complete date', () => {
    const { onCommit } = show()
    fireEvent.change(input(), { target: { value: '2026-05-01' } })
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('2026-05-01')
  })

  it('keeps a half-typed year on screen but does not save it', () => {
    const { onCommit } = show()
    fireEvent.change(input(), { target: { value: '0002-05-01' } })
    expect(input().value).toBe('0002-05-01')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('does not save a year with more than four digits, which some browsers let you type', () => {
    const { onCommit } = show()
    fireEvent.change(input(), { target: { value: '19999-05-01' } })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('saves only dates within the range it is given, and offers only that range in the picker', () => {
    const { onCommit } = show({ min: '2026-01-01', max: '2026-12-31' })
    expect(input().min).toBe('2026-01-01')
    expect(input().max).toBe('2026-12-31')
    fireEvent.change(input(), { target: { value: '2025-12-31' } })
    fireEvent.change(input(), { target: { value: '2027-01-01' } })
    expect(onCommit).not.toHaveBeenCalled()
    fireEvent.change(input(), { target: { value: '2026-01-01' } })
    fireEvent.change(input(), { target: { value: '2026-12-31' } })
    expect(onCommit).toHaveBeenCalledTimes(2)
  })

  it('does not save a cleared box', () => {
    const { onCommit } = show({ value: '2026-05-01' })
    fireEvent.change(input(), { target: { value: '' } })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('goes back to the saved date when you leave the box with something unsaved', async () => {
    const user = userEvent.setup()
    show({ value: '2026-05-01' })
    await user.click(input())
    fireEvent.change(input(), { target: { value: '0002-05-01' } })
    await user.tab()
    expect(input().value).toBe('2026-05-01')
  })

  it('follows a change from outside, such as the year being switched', () => {
    const { rerender } = show({ value: '2026-05-01' })
    rerender({ value: '2025-05-01' })
    expect(input().value).toBe('2025-05-01')
  })

  it('does not overwrite what you are typing when the saved date changes meanwhile', async () => {
    const user = userEvent.setup()
    const { rerender } = show({ value: '2026-05-01' })
    await user.click(input())
    fireEvent.change(input(), { target: { value: '0002-05-01' } })
    rerender({ value: '2025-05-01' })
    expect(input().value).toBe('0002-05-01')
  })
})
