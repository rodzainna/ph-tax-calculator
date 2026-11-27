// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { formatPeso } from '@/lib/peso.ts'
import { fakeScreen } from '@/test/fakeScreen.ts'
import { moneyRows } from '@/test/moneyRows.ts'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import MyYear from './MyYear.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const show = () =>
  render(
    <TooltipProvider>
      <MyYear />
    </TooltipProvider>,
  )

const chooseType = async (name: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: 'I am' }))
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name }))
}

describe('MyYear: who it is for', () => {
  it('starts with one employer and no business', () => {
    show()
    expect(screen.getByText('Employer #1')).toBeTruthy()
    expect(screen.queryByText('Business or freelance')).toBeNull()
  })

  it('shows only the business for someone self-employed', async () => {
    show()
    await chooseType('Self-employed')
    expect(screen.getByText('Business or freelance')).toBeTruthy()
    expect(screen.queryByText('Employer #1')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add another employer' })).toBeNull()
  })

  it('shows both for mixed income', async () => {
    show()
    await chooseType('Mixed income')
    expect(screen.getByText('Employer #1')).toBeTruthy()
    expect(screen.getByText('Business or freelance')).toBeTruthy()
  })

  it('keeps the employers when switching away and back', async () => {
    show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '5')
    await chooseType('Self-employed')
    await chooseType('Employee')
    expect((screen.getByRole('textbox', { name: 'Basic salary' }) as HTMLInputElement).value).toBe('5')
  })
})

describe('MyYear: the estimate', () => {
  it('asks for a salary before there is an estimate', () => {
    show()
    expect(screen.getByText('Your tax for the year')).toBeTruthy()
  })

  it('works out the estimate from what is typed', async () => {
    const { container } = show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const rows = moneyRows(container.querySelector('.receipt') as HTMLElement)
    expect(rows['Regular pay']).toBe(formatPeso(600_000))
    expect(rows['Gross pay']).toBe(formatPeso(650_000))
  })

  it('shows the insights under the receipt once there is an estimate', async () => {
    show()
    const side = () => within(screen.getByRole('complementary'))
    expect(side().queryByText('Your tax bracket')).toBeNull()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    expect(side().getByText('Your tax bracket')).toBeTruthy()
  })

  // A month's contributions on 50,000 are 1,750 SSS, 1,250 PhilHealth and 200 Pag-IBIG: 38,400 a year.
  // 600,000 - 38,400 = 561,600 taxable, and the tax is 22,500 + 20% of 161,600 = 54,820.
  it('keeps the same figure in the bar for narrow screens', async () => {
    const { container } = show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const figureIn = (selector: string) => container.querySelector(selector)?.textContent
    expect(figureIn('.receipt p.text-4xl')).toBe(formatPeso(54_820))
    expect(figureIn('[data-summary-bar] [aria-live] > p:last-child')).toBe(formatPeso(54_820))
  })

  it('opens the same estimate from the bar', async () => {
    show()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(within(screen.getByRole('dialog')).getByText('Tax estimate · 2026')).toBeTruthy()
  })

  it('hands over to the side column when the screen widens with the bar details open', async () => {
    const screenWidth = fakeScreen()
    show()
    const user = userEvent.setup()
    const sideColumn = screen.getByRole('complementary', { name: 'Your estimate' })
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('button', { name: 'Details' }))
    screenWidth.resize(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(sideColumn))
  })

  it('fills in the employer summary beside the card', async () => {
    show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const summary = screen.getByRole('group', { name: 'Summary Employer #1' })
    expect(moneyRows(summary)['Total pay']).toBe(formatPeso(650_000))
  })

  it('uses the tax year that was picked', async () => {
    const user = userEvent.setup()
    show()
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('combobox', { name: 'Tax year' }))
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: '2024' }))
    expect(screen.getByText('Tax estimate · 2024')).toBeTruthy()
  })

  it('counts the business income for someone self-employed', async () => {
    const { container } = show()
    await chooseType('Self-employed')
    const business = within(screen.getByText('Business or freelance').closest('[data-slot="card"]') as HTMLElement)
    await userEvent.setup().type(business.getByRole('textbox', { name: 'Amount' }), '50000')
    // The receipt and the business summary each have a "Gross receipts" row, so each is read on its own.
    const receipt = container.querySelector('.receipt') as HTMLElement
    expect(moneyRows(receipt)['Gross receipts']).toBe(formatPeso(600_000))
    expect(moneyRows(receipt)['Taxable income']).toBe(formatPeso(360_000))
    const summary = screen.getByRole('group', { name: 'Summary Business' })
    expect(moneyRows(summary)['Gross receipts']).toBe(formatPeso(600_000))
    expect(moneyRows(summary)['Net income']).toBe(formatPeso(360_000))
  })
})

describe('MyYear: employers', () => {
  it('adds and removes an employer', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole('button', { name: 'Add another employer' }))
    expect(screen.getByText('Employer #2')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove employer #1' }))
    expect(screen.queryByText('Employer #2')).toBeNull()
    expect(screen.getByText('Employer #1')).toBeTruthy()
  })

  it('can remove an employer only when there is more than one', async () => {
    show()
    expect(screen.queryByRole('button', { name: /Remove employer/ })).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another employer' }))
    expect(screen.getAllByRole('button', { name: /Remove employer/ })).toHaveLength(2)
  })

  it('shows the tax withheld typed in the summary in the employer card as well', async () => {
    show()
    const summary = within(screen.getByRole('group', { name: 'Summary Employer #1' }))
    await userEvent.setup().type(summary.getByRole('textbox', { name: 'Tax withheld' }), '1000')
    await userEvent.setup().click(screen.getByRole('button', { name: 'More' }))
    const fields = screen.getAllByRole('textbox', { name: 'Tax withheld' }) as HTMLInputElement[]
    expect(fields.map((f) => f.value)).toEqual(['1,000', '1,000'])
  })
})

describe('MyYear: how often a benefit is paid', () => {
  it.each([
    ['Yearly', 'Yearly'],
    ['Cutoff', 'Twice a month'],
  ])('keeps a chosen %s while Paid changes to %s and back', async (per, paid) => {
    const user = userEvent.setup()
    show()
    const pick = async (field: string, option: string) => {
      await user.click(screen.getByRole('combobox', { name: field }))
      await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }))
    }
    const chosen = () => screen.getByRole('combobox', { name: 'Per' }).textContent
    await user.click(screen.getByRole('switch', { name: 'De minimis benefits' }))
    await pick('Per', per)
    for (const next of [paid, 'Monthly']) {
      await pick('Paid', next)
      expect(chosen(), next).toBe(per)
    }
  })

  it('follows Paid while Per has not been chosen', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole('switch', { name: 'De minimis benefits' }))
    for (const [paid, per] of [
      ['Twice a month', 'Cutoff'],
      ['Yearly', 'Yearly'],
      ['Monthly', 'Monthly'],
    ] as const) {
      await user.click(screen.getByRole('combobox', { name: 'Paid' }))
      await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: paid }))
      expect(screen.getByRole('combobox', { name: 'Per' }).textContent, paid).toBe(per)
    }
  })
})

describe('MyYear: mixed income', () => {
  it('always keeps an employer, since without one it would be taxed as self-employed', async () => {
    const user = userEvent.setup()
    show()
    await chooseType('Mixed income')
    expect(screen.queryByRole('button', { name: /Remove employer/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Add another employer' }))
    await user.click(screen.getByRole('button', { name: 'Remove employer #1' }))
    expect(screen.queryByRole('button', { name: /Remove employer/ })).toBeNull()
  })

  it('puts a line between each job and before the business', async () => {
    const { container } = show()
    const lines = () => container.querySelectorAll('hr').length
    expect(lines()).toBe(0)
    await chooseType('Mixed income')
    expect(lines()).toBe(1)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another employer' }))
    expect(lines()).toBe(2)
    await chooseType('Self-employed')
    expect(lines()).toBe(0)
  })

  it('blanks every summary when one employer has a mistake, and says which', async () => {
    const user = userEvent.setup()
    const { container } = show()
    await chooseType('Mixed income')
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('button', { name: 'Add another employer' }))
    const summaries = () =>
      ['Summary Employer #1', 'Summary Employer #2', 'Summary Business'].map((name) =>
        Object.values(moneyRows(screen.getByRole('group', { name }))),
      )
    expect(summaries()[0]).toContain(formatPeso(650_000))
    // The second job starts in September and ends in March.
    const from = container.querySelectorAll<HTMLInputElement>('input[id^="from-"]')[1]
    fireEvent.change(from, { target: { value: '2026-09-01' } })
    await user.click(screen.getAllByRole('switch', { name: 'Still working' })[1])
    const to = container.querySelector('input[type="date"][id^="to-"]') as HTMLInputElement
    fireEvent.change(to, { target: { value: '2026-03-31' } })
    expect(
      summaries()
        .flat()
        .every((amount) => amount === '—'),
    ).toBe(true)
    const estimate = within(screen.getByRole('complementary'))
    expect(estimate.getByRole('alert').textContent).toBe('Employer #2: the end date is before the start date.')
  })
})

describe('MyYear: itemized expenses', () => {
  it('compares them with the 40% standard deduction, and only while itemizing', async () => {
    const user = userEvent.setup()
    show()
    await chooseType('Self-employed')
    const business = within(screen.getByText('Business or freelance').closest('[data-slot="card"]') as HTMLElement)
    await user.type(business.getByRole('textbox', { name: 'Amount' }), '50000')
    const comparison = () => screen.queryByText(/^Your expenses for the year are/)?.textContent ?? null
    const chooseDeduction = async (name: string) => {
      await user.click(screen.getByRole('combobox', { name: 'Deduction' }))
      await user.click(within(screen.getByRole('listbox')).getByRole('option', { name }))
    }
    expect(comparison()).toBeNull()

    await chooseDeduction('Itemized expenses')
    const expense = within(screen.getByRole('group', { name: 'Expense 1' }))
    await user.type(expense.getByRole('textbox', { name: 'Amount' }), '30000')
    expect(comparison()).toBe(
      'Your expenses for the year are ₱360,000.00. The 40% standard deduction would be ₱240,000.00, so itemizing deducts more.',
    )

    await chooseDeduction('40% standard deduction')
    expect(comparison()).toBeNull()
  })
})
