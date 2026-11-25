// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  annualReturnWithEightPercent,
  annualReturnWithGraduated,
  type AnnualReturnResult,
} from '@/engine/annualReturn.ts'
import type { EmployerCompensation } from '@/engine/compensationTax.ts'
import { formatPeso } from '@/lib/peso.ts'
import type { TaxMethod } from '@/lib/taxpayer.ts'
import { newBusiness, type BusinessState } from '@/lib/yearForm.ts'
import BusinessSummary from './BusinessSummary.tsx'

afterEach(cleanup)

const business = (over: Partial<BusinessState> = {}): BusinessState => ({ ...newBusiness(1), ...over })

const salary: EmployerCompensation = {
  label: 'Employer #1',
  regularPay: 600_000,
  thirteenthMonthAndBenefits: 0,
  deMinimisExcess: 0,
  mandatoryContributions: 0,
  taxWithheld: 0,
}

const eightPercent = (grossReceipts: number, employers: EmployerCompensation[] = []) =>
  annualReturnWithEightPercent({ year: 2026, employers, business: { grossReceipts } })

const graduated = (grossReceipts: number, rest: { otherNonOperatingIncome?: number; itemizedExpenses?: number } = {}) =>
  annualReturnWithGraduated({
    year: 2026,
    business: {
      grossReceipts,
      otherNonOperatingIncome: rest.otherNonOperatingIncome,
      deduction: rest.itemizedExpenses === undefined ? 'osd' : 'itemized',
      itemizedExpenses: rest.itemizedExpenses,
    },
  })

const show = (method: TaxMethod, result?: AnnualReturnResult, b: BusinessState = business()) => {
  const onQuarterlyPaidChange = vi.fn()
  const onCredit2307Change = vi.fn()
  const view = render(
    <TooltipProvider>
      <BusinessSummary
        method={method}
        business={b}
        result={result}
        onQuarterlyPaidChange={onQuarterlyPaidChange}
        onCredit2307Change={onCredit2307Change}
      />
    </TooltipProvider>,
  )
  return { onQuarterlyPaidChange, onCredit2307Change, ...view }
}

/** The label and amount of each row. A row that takes money off has "minus" read out before its amount. */
const rows = (container: HTMLElement): Record<string, string | null> =>
  Object.fromEntries(
    [...container.querySelectorAll('dt')].map((term) => [
      term.textContent,
      term.nextElementSibling?.textContent ?? null,
    ]),
  )

describe('BusinessSummary: the 8% option', () => {
  it('shows the receipts, the reduction, what is taxed and the tax', () => {
    const { container } = show('eight-percent', eightPercent(600_000))
    const r = rows(container)
    expect(r['Receipts and other income']).toBe(formatPeso(600_000))
    expect(r['Reduction']).toContain(formatPeso(250_000))
    expect(r['Taxable amount']).toBe(formatPeso(350_000))
    expect(r['Tax at 8%']).toBe(formatPeso(28_000))
  })

  it('takes the reduction off, as a minus', () => {
    const { container } = show('eight-percent', eightPercent(600_000))
    expect(rows(container)['Reduction']).toContain('minus')
  })

  it('shows a reduction of no more than the receipts', () => {
    const { container } = show('eight-percent', eightPercent(100_000))
    const r = rows(container)
    expect(r['Reduction']).toContain(formatPeso(100_000))
    expect(r['Taxable amount']).toBe(formatPeso(0))
    expect(r['Tax at 8%']).toBe(formatPeso(0))
  })

  it('shows no reduction for someone who also earns a salary', () => {
    const { container } = show('eight-percent', eightPercent(600_000, [salary]))
    const r = rows(container)
    expect(r['Reduction']).toContain(formatPeso(0))
    expect(r['Taxable amount']).toBe(formatPeso(600_000))
    expect(r['Tax at 8%']).toBe(formatPeso(48_000))
  })

  it('has no graduated rows', () => {
    const { container } = show('eight-percent', eightPercent(600_000))
    expect(Object.keys(rows(container))).not.toContain('Gross receipts')
    expect(Object.keys(rows(container))).not.toContain('Net income')
  })

  it('shows dashes while there is no estimate', () => {
    const { container } = show('eight-percent')
    expect(Object.values(rows(container))).toEqual(['—', '—', '—', '—'])
  })
})

describe('BusinessSummary: graduated rates', () => {
  it('shows the receipts, the 40% deduction and the net income', () => {
    const { container } = show('graduated', graduated(600_000))
    const r = rows(container)
    expect(r['Gross receipts']).toBe(formatPeso(600_000))
    expect(r['40% deduction']).toContain(formatPeso(240_000))
    expect(r['Net income']).toBe(formatPeso(360_000))
  })

  it('names itemized expenses instead of the 40% deduction', () => {
    const { container } = show('graduated', graduated(600_000, { itemizedExpenses: 100_000 }))
    const r = rows(container)
    expect(r['Itemized expenses']).toContain(formatPeso(100_000))
    expect(r['Net income']).toBe(formatPeso(500_000))
    expect(Object.keys(r)).not.toContain('40% deduction')
  })

  it('adds the other income, so the rows add up to the net income', () => {
    const { container } = show('graduated', graduated(600_000, { otherNonOperatingIncome: 50_000 }))
    const r = rows(container)
    expect(r['Other income']).toContain(formatPeso(50_000))
    expect(r['Other income']).toContain('plus')
    expect(r['Net income']).toBe(formatPeso(410_000))
  })

  it('leaves the other income row out when there is none', () => {
    const { container } = show('graduated', graduated(600_000))
    expect(Object.keys(rows(container))).not.toContain('Other income')
  })

  it('shows a loss as a negative net income', () => {
    const { container } = show('graduated', graduated(100_000, { itemizedExpenses: 130_000 }))
    expect(rows(container)['Net income']).toBe(formatPeso(-30_000))
  })

  it('has no 8% rows', () => {
    const { container } = show('graduated', graduated(600_000))
    expect(Object.keys(rows(container))).not.toContain('Tax at 8%')
    expect(Object.keys(rows(container))).not.toContain('Reduction')
  })

  it('shows dashes while there is no estimate', () => {
    const { container } = show('graduated')
    expect(Object.values(rows(container))).toEqual(['—', '—', '—'])
  })
})

describe('BusinessSummary: the tax already paid', () => {
  it('shows the values saved on the business, each in its own field', () => {
    show('graduated', undefined, business({ quarterlyPaid: '12,345', credit2307: '6,789' }))
    expect((screen.getByRole('textbox', { name: 'Tax paid' }) as HTMLInputElement).value).toBe('12,345')
    expect((screen.getByRole('textbox', { name: 'Tax withheld' }) as HTMLInputElement).value).toBe('6,789')
  })

  it('reports a typed quarterly payment, and not the withheld tax', async () => {
    const { onQuarterlyPaidChange, onCredit2307Change } = show('graduated')
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Tax paid' }), '5')
    expect(onQuarterlyPaidChange).toHaveBeenCalledWith('5')
    expect(onCredit2307Change).not.toHaveBeenCalled()
  })

  it('reports a typed withheld amount, and not the quarterly payment', async () => {
    const { onQuarterlyPaidChange, onCredit2307Change } = show('graduated')
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Tax withheld' }), '7')
    expect(onCredit2307Change).toHaveBeenCalledWith('7')
    expect(onQuarterlyPaidChange).not.toHaveBeenCalled()
  })

  it('has both fields with either option', () => {
    show('eight-percent')
    expect(screen.getByRole('textbox', { name: 'Tax paid' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Tax withheld' })).toBeTruthy()
  })

  it('is a group named by its title', () => {
    show('graduated')
    const group = within(screen.getByRole('group', { name: 'Summary Business' }))
    expect(group.getByRole('textbox', { name: 'Tax paid' })).toBeTruthy()
  })
})
