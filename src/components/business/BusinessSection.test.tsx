// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { TaxMethod } from '@/lib/taxpayer.ts'
import { newBusiness, type BusinessState } from '@/lib/yearForm.ts'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import BusinessSection from './BusinessSection.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const business = (over: Partial<BusinessState> = {}): BusinessState => ({ ...newBusiness(1), ...over })

const show = (b: BusinessState = business(), props: { method?: TaxMethod; deductionHint?: string } = {}) => {
  const onChange = vi.fn()
  const nextLineId = vi.fn(() => 77)
  render(
    <BusinessSection
      business={b}
      method={props.method ?? 'graduated'}
      year={2026}
      asOf="2026-06-15"
      onChange={onChange}
      nextLineId={nextLineId}
      deductionHint={props.deductionHint}
    />,
  )
  return { onChange, nextLineId }
}

const box = (name: string) => screen.getByRole('textbox', { name }) as HTMLInputElement
const openMore = async () => await userEvent.setup().click(screen.getByRole('button', { name: 'More' }))
const pick = async (field: string, option: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: field }))
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }))
}

describe('BusinessSection: the card', () => {
  it('has a title and says which tax option it is for', () => {
    show(business(), { method: 'graduated' })
    expect(screen.getByText('Business or freelance')).toBeTruthy()
    expect(screen.getByText('Graduated rates')).toBeTruthy()
    expect(screen.queryByText('8% option')).toBeNull()
  })

  it('names the 8% option when that is the one picked', () => {
    show(business(), { method: 'eight-percent' })
    expect(screen.getByText('8% option')).toBeTruthy()
    expect(screen.queryByText('Graduated rates')).toBeNull()
  })

  it('shows each field its own saved value', () => {
    show(business({ amount: '111', frequency: 'quarter' }))
    expect(box('Amount').value).toBe('111')
    expect(screen.getByRole('combobox', { name: 'Received' }).textContent).toBe('Quarterly')
  })

  it('reports a typed amount with the rest kept', async () => {
    const b = business({ otherIncome: '9' })
    const { onChange } = show(b)
    await userEvent.setup().type(box('Amount'), '5')
    expect(onChange).toHaveBeenCalledWith({ ...b, amount: '5' })
  })

  it('reports how often the income is received', async () => {
    const b = business({ amount: '1000' })
    const { onChange } = show(b)
    await pick('Received', 'Yearly')
    expect(onChange).toHaveBeenCalledWith({ ...b, frequency: 'year' })
  })

  it('offers monthly, quarterly and yearly', async () => {
    show()
    await userEvent.setup().click(screen.getByRole('combobox', { name: 'Received' }))
    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Monthly', 'Quarterly', 'Yearly'])
  })

  it('reports a date change merged into the business', () => {
    const b = business({ amount: '1000' })
    const { onChange } = show(b)
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
    expect(onChange).toHaveBeenCalledWith({ ...b, startDate: '2026-03-01' })
  })

  it('words the open-ended switch for income', () => {
    show()
    expect(screen.getByRole('switch', { name: 'Still receiving' })).toBeTruthy()
  })
})

describe('BusinessSection: the deduction', () => {
  it('is chosen only with graduated rates', () => {
    show(business(), { method: 'eight-percent' })
    expect(screen.queryByRole('combobox', { name: 'Deduction' })).toBeNull()
  })

  it('starts on the 40% standard deduction, with no expense rows', () => {
    show(business({ deduction: 'osd' }))
    expect(screen.getByRole('combobox', { name: 'Deduction' }).textContent).toBe('40% standard deduction')
    expect(screen.queryByRole('button', { name: 'Add another expense' })).toBeNull()
  })

  it('reports a switch to itemized expenses with the rest kept', async () => {
    const b = business({ amount: '1000' })
    const { onChange } = show(b)
    await pick('Deduction', 'Itemized expenses')
    expect(onChange).toHaveBeenCalledWith({ ...b, deduction: 'itemized' })
  })

  it('shows the expense rows when itemized, each with its saved name', () => {
    show(
      business({
        deduction: 'itemized',
        expenses: [
          { id: 5, label: 'Rent', amount: '100', per: 'month' },
          { id: 6, label: 'Permit', amount: '200', per: 'year' },
        ],
      }),
    )
    expect(screen.getAllByRole('textbox', { name: 'Expense name' }).map((i) => (i as HTMLInputElement).value)).toEqual([
      'Rent',
      'Permit',
    ])
  })

  it('reports an edited expense with the rest of the business kept', async () => {
    const rent = { id: 5, label: 'Rent', amount: '100', per: 'month' as const }
    const b = business({ deduction: 'itemized', expenses: [rent], amount: '1000' })
    const { onChange } = show(b)
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Expense name' }), '!')
    expect(onChange).toHaveBeenCalledWith({ ...b, expenses: [{ ...rent, label: 'Rent!' }] })
  })

  it('hands out a fresh id for a new expense', async () => {
    const rent = { id: 5, label: 'Rent', amount: '100', per: 'month' as const }
    const b = business({ deduction: 'itemized', expenses: [rent] })
    const { onChange, nextLineId } = show(b)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another expense' }))
    expect(nextLineId).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      ...b,
      expenses: [rent, { id: 77, label: '', amount: '', per: 'month' }],
    })
  })

  it('shows the hint under the expenses when itemized', () => {
    show(business({ deduction: 'itemized' }), { deductionHint: 'Your expenses are more than 40% of your receipts.' })
    expect(screen.getByText('Your expenses are more than 40% of your receipts.')).toBeTruthy()
  })

  it('leaves no empty paragraph behind when there is no hint', () => {
    show(business({ deduction: 'itemized' }))
    const empty = [...document.querySelectorAll('p')].filter((p) => p.textContent === '')
    expect(empty).toHaveLength(0)
  })

  it('does not show the hint with the standard deduction, which has no expenses to compare', () => {
    show(business({ deduction: 'osd' }), { deductionHint: 'Your expenses are more than 40% of your receipts.' })
    expect(screen.queryByText('Your expenses are more than 40% of your receipts.')).toBeNull()
  })
})

describe('BusinessSection: the More tray', () => {
  it('has other income, the 1701Q paid and the 2307 credit, each with its own saved value', async () => {
    show(business({ otherIncome: '1', quarterlyPaid: '2', credit2307: '3' }))
    await openMore()
    expect(box('Other income').value).toBe('1')
    expect(box('1701Q paid').value).toBe('2')
    expect(box('Withheld (2307)').value).toBe('3')
  })

  it('is there with the 8% option too', async () => {
    show(business(), { method: 'eight-percent' })
    await openMore()
    expect(box('Other income')).toBeTruthy()
  })

  it.each([
    ['Other income', 'otherIncome'],
    ['1701Q paid', 'quarterlyPaid'],
    ['Withheld (2307)', 'credit2307'],
  ] as const)('reports a typed %s', async (label, key) => {
    const b = business({ amount: '1000' })
    const { onChange } = show(b)
    await openMore()
    await userEvent.setup().type(box(label), '4')
    expect(onChange).toHaveBeenCalledWith({ ...b, [key]: '4' })
  })
})
