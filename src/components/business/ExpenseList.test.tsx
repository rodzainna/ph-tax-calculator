// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ExpenseLine } from '@/lib/yearForm.ts'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import ExpenseList from './ExpenseList.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const rent: ExpenseLine = { id: 10, label: 'Rent', amount: '12000', per: 'month' }
const permit: ExpenseLine = { id: 11, label: 'Permit', amount: '5000', per: 'year' }

const show = (lines: ExpenseLine[]) => {
  const onChange = vi.fn()
  const nextLineId = vi.fn(() => 99)
  render(<ExpenseList lines={lines} onChange={onChange} nextLineId={nextLineId} />)
  return { onChange, nextLineId }
}

describe('ExpenseList', () => {
  it('shows a row for each expense, with its name, amount and how often', () => {
    show([rent, permit])
    expect(screen.getAllByRole('textbox', { name: 'Expense name' }).map((i) => (i as HTMLInputElement).value)).toEqual([
      'Rent',
      'Permit',
    ])
    expect(screen.getAllByRole('textbox', { name: 'Amount' }).map((i) => (i as HTMLInputElement).value)).toEqual([
      '12000',
      '5000',
    ])
    expect(screen.getAllByRole('combobox').map((c) => c.textContent)).toEqual(['Monthly', 'Yearly'])
  })

  it('offers monthly, quarterly and yearly', async () => {
    const user = userEvent.setup()
    show([rent])
    await user.click(screen.getByRole('combobox'))
    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Monthly', 'Quarterly', 'Yearly'])
  })

  it('labels the how-often dropdown and gives each name field a placeholder', () => {
    show([rent, permit])
    expect(screen.getAllByRole('combobox', { name: 'Per' })).toHaveLength(2)
    expect(screen.getAllByPlaceholderText('Name')).toHaveLength(2)
  })

  it('hides the repeated column headers only on a row wide enough to be one line', () => {
    show([rent, permit])
    for (const header of ['Expense', 'Amount', 'Per']) {
      const [first, second] = screen.getAllByText(header)
      expect(first.classList.contains('@min-[26rem]:sr-only'), `${header} on the first row`).toBe(false)
      expect(second.classList.contains('@min-[26rem]:sr-only'), `${header} on the second row`).toBe(true)
    }
  })

  it('measures each row by its own width', () => {
    show([rent, permit])
    for (const row of screen.getAllByRole('group')) {
      expect(row.parentElement?.classList.contains('@container')).toBe(true)
    }
  })

  it('groups each row under its own number', () => {
    show([rent, permit])
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['Expense 1', 'Expense 2'])
  })

  it('reports a new name for that expense only', async () => {
    const { onChange } = show([rent, permit])
    await userEvent.setup().type(screen.getAllByRole('textbox', { name: 'Expense name' })[1], '!')
    expect(onChange).toHaveBeenCalledWith([rent, { ...permit, label: 'Permit!' }])
  })

  it('reports a new amount for that expense only', async () => {
    const { onChange } = show([rent, permit])
    await userEvent.setup().type(screen.getAllByRole('textbox', { name: 'Amount' })[0], '0')
    expect(onChange).toHaveBeenCalledWith([{ ...rent, amount: '120,000' }, permit])
  })

  it('reports how often for that expense only', async () => {
    const user = userEvent.setup()
    const { onChange } = show([rent, permit])
    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Quarterly' }))
    expect(onChange).toHaveBeenCalledWith([{ ...rent, per: 'quarter' }, permit])
  })

  it('adds a blank monthly expense with the next free id', async () => {
    const { onChange, nextLineId } = show([rent])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another expense' }))
    expect(nextLineId).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([rent, { id: 99, label: '', amount: '', per: 'month' }])
  })

  it('removes only the expense whose button was pressed', async () => {
    const { onChange, nextLineId } = show([rent, permit])
    const buttons = screen.getAllByRole('button', { name: 'Remove this expense' })
    expect(buttons).toHaveLength(2)
    await userEvent.setup().click(buttons[1])
    expect(onChange).toHaveBeenCalledWith([rent])
    expect(nextLineId).not.toHaveBeenCalled()
  })

  it('clears the last expense instead of removing it, so there is always a row to type in', async () => {
    const { onChange, nextLineId } = show([rent])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove this expense' }))
    expect(onChange).toHaveBeenCalledWith([{ id: rent.id, label: '', amount: '', per: 'month' }])
    expect(nextLineId).not.toHaveBeenCalled()
  })
})
