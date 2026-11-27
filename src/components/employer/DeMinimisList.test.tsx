// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import type { DeMinimisLine } from '@/lib/yearForm.ts'
import DeMinimisList from './DeMinimisList.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const rice: DeMinimisLine = { id: 10, label: 'Rice', amount: '1500', per: 'month' }
const laundry: DeMinimisLine = { id: 11, label: 'Laundry', amount: '300', per: 'quarter' }

const show = (lines: DeMinimisLine[]) => {
  const onChange = vi.fn()
  const onTurnOff = vi.fn()
  const nextLineId = vi.fn(() => 99)
  render(
    <DeMinimisList
      lines={lines}
      payFrequency="monthly"
      onChange={onChange}
      onTurnOff={onTurnOff}
      nextLineId={nextLineId}
    />,
  )
  return { onChange, onTurnOff, nextLineId }
}

describe('DeMinimisList', () => {
  it('shows a row for each benefit, with its name, amount and how often', () => {
    show([rice, laundry])
    expect(screen.getAllByRole('textbox', { name: 'Benefit name' }).map((i) => (i as HTMLInputElement).value)).toEqual([
      'Rice',
      'Laundry',
    ])
    expect(screen.getAllByRole('textbox', { name: 'Amount' }).map((i) => (i as HTMLInputElement).value)).toEqual([
      '1500',
      '300',
    ])
    expect(screen.getAllByRole('combobox').map((c) => c.textContent)).toEqual(['Monthly', 'Quarterly'])
  })

  it('hides the repeated name header only on a row wide enough to be one line', () => {
    show([rice, laundry])
    const [first, second] = screen.getAllByText('Benefit')
    expect(first.classList.contains('sr-only')).toBe(false)
    expect(first.classList.contains('@min-[26rem]:sr-only')).toBe(false)
    expect(second.classList.contains('@min-[26rem]:sr-only')).toBe(true)
    expect(second.classList.contains('sr-only')).toBe(false)
  })

  it('groups each row under its own number, so a screen reader can tell the rows apart', () => {
    show([rice, laundry])
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Benefit 1', 'Benefit 2'])
    expect(within(groups[1]).getByRole('textbox', { name: 'Benefit name' })).toHaveProperty('value', 'Laundry')
    expect(within(groups[0]).getByRole('button', { name: 'Remove this benefit' })).toBeTruthy()
  })

  it('reports a new name for that benefit only', async () => {
    const { onChange } = show([rice, laundry])
    await userEvent.setup().type(screen.getAllByRole('textbox', { name: 'Benefit name' })[1], '!')
    expect(onChange).toHaveBeenCalledWith([rice, { ...laundry, label: 'Laundry!' }])
  })

  it('reports a new amount for that benefit only', async () => {
    const { onChange } = show([rice, laundry])
    await userEvent.setup().type(screen.getAllByRole('textbox', { name: 'Amount' })[0], '0')
    expect(onChange).toHaveBeenCalledWith([{ ...rice, amount: '15,000' }, laundry])
  })

  it('reports how often for that benefit only', async () => {
    const user = userEvent.setup()
    const { onChange } = show([rice, laundry])
    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Yearly' }))
    expect(onChange).toHaveBeenCalledWith([{ ...rice, per: 'year' }, laundry])
  })

  it('adds a blank benefit with the next free id', async () => {
    const { onChange, nextLineId } = show([rice])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another benefit' }))
    expect(nextLineId).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([rice, { id: 99, label: '', amount: '', per: 'month' }])
  })

  it('removes only the benefit whose button was pressed', async () => {
    const { onChange, onTurnOff } = show([rice, laundry])
    const buttons = screen.getAllByRole('button', { name: 'Remove this benefit' })
    expect(buttons).toHaveLength(2)
    await userEvent.setup().click(buttons[0])
    expect(onChange).toHaveBeenCalledWith([laundry])
    expect(onTurnOff).not.toHaveBeenCalled()
  })

  it('turns the section off, instead of leaving it empty, when the last benefit is removed', async () => {
    const { onChange, onTurnOff } = show([rice])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove this benefit and turn de minimis off' }))
    expect(onTurnOff).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})
