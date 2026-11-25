// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import { formatPeso } from '@/lib/peso.ts'
import { annualResults, salaryJob } from '@/test/annualResults.ts'
import { moneyRows } from '@/test/moneyRows.ts'
import Receipt from './Receipt.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const rowsFor = (result: AnnualReturnResult) => {
  const { container } = render(
    <TooltipProvider>
      <Receipt result={result} />
    </TooltipProvider>,
  )
  return moneyRows(container)
}

const peso = formatPeso

describe('Receipt: pay only', () => {
  const rows = () => rowsFor(annualResults.employee())

  it('lists the pay, the contributions and the exempt 13th month, and works out the taxable income', () => {
    const r = rows()
    expect(r['Regular pay']).toBe(peso(600_000))
    expect(r['13th month and bonuses']).toBe(peso(100_000))
    expect(r['Gross pay']).toBe(peso(700_000))
    expect(r['SSS, PhilHealth, Pag-IBIG']).toContain(peso(20_000))
    expect(r['Exempt 13th month']).toContain(peso(90_000))
    expect(r['Total deductions']).toContain(peso(110_000))
    expect(r['Taxable income']).toBe(peso(590_000))
  })

  it('takes the credits off and shows the tax withheld by the employer', () => {
    const r = rows()
    expect(r['Withheld by employers']).toBe(peso(50_000))
    expect(r['Credits']).toContain('minus')
    expect(r['Credits']).toContain(peso(50_000))
  })

  it('has no business rows', () => {
    const labels = Object.keys(rows())
    for (const label of [
      'Total receipts',
      'Gross receipts',
      'Reduction',
      'Tax on pay',
      'Tax at 8%',
      'Quarterly tax paid',
    ]) {
      expect(labels, label).not.toContain(label)
    }
  })

  it('leaves out the exempt 13th month when there is none', () => {
    const labels = Object.keys(rowsFor(annualResults.employee({ ...salaryJob, thirteenthMonthAndBenefits: 0 })))
    expect(labels).not.toContain('Exempt 13th month')
  })

  it('ends with the tax and what is left to pay after the credits', () => {
    const result = annualResults.employee()
    const r = rowsFor(result)
    expect(r['Total income tax']).toBe(peso(result.totalTaxDue))
    expect(r['To pay']).toContain(peso(result.balance))
  })
})

describe('Receipt: the 8% option', () => {
  const business = { grossReceipts: 600_000, quarterlyTaxPaid: 5_000, creditableWithholding: 3_000 }

  it('takes the reduction off the receipts and taxes the rest at 8%', () => {
    const r = rowsFor(annualResults.eightPercent(business))
    expect(r['Total receipts']).toBe(peso(600_000))
    expect(r['Gross income']).toBe(peso(600_000))
    expect(r['Reduction']).toContain(peso(250_000))
    expect(r['Taxable income']).toBe(peso(350_000))
    expect(r['Total income tax']).toBe(peso(28_000))
  })

  it('credits the quarterly payments and the 2307s', () => {
    const r = rowsFor(annualResults.eightPercent(business))
    expect(r['Quarterly tax paid']).toBe(peso(5_000))
    expect(r['Withheld, with a 2307']).toBe(peso(3_000))
    expect(r['Credits']).toContain(peso(8_000))
    expect(r['To pay']).toContain(peso(20_000))
  })

  it('has no pay rows and no separate tax on pay', () => {
    const labels = Object.keys(rowsFor(annualResults.eightPercent(business)))
    for (const label of ['Regular pay', 'Withheld by employers', 'Tax on pay', 'SSS, PhilHealth, Pag-IBIG']) {
      expect(labels, label).not.toContain(label)
    }
  })

  it('shows a reduction of no more than the receipts', () => {
    const r = rowsFor(annualResults.eightPercent({ grossReceipts: 100_000 }))
    expect(r['Reduction']).toContain(peso(100_000))
    expect(r['Total income tax']).toBe(peso(0))
  })

  it('shows no reduction next to a salary, and the tax on pay apart from the 8% tax', () => {
    const result = annualResults.eightPercent(business, [salaryJob])
    const r = rowsFor(result)
    expect(r['Reduction']).toContain(peso(0))
    expect(r['Tax at 8%']).toBe(peso(48_000))
    expect(r['Tax on pay']).toBe(peso(result.compensation!.taxDue))
    expect(result.compensation!.taxDue).not.toBe(48_000)
    expect(r['Gross income']).toBe(peso(1_300_000))
    expect(r['Withheld by employers']).toBe(peso(50_000))
    expect(r['Quarterly tax paid']).toBe(peso(5_000))
  })
})

describe('Receipt: graduated rates for the business', () => {
  const business = { grossReceipts: 600_000 }

  it('takes the 40% deduction off the receipts', () => {
    const r = rowsFor(annualResults.graduated(business))
    expect(r['Gross receipts']).toBe(peso(600_000))
    expect(r['40% deduction']).toContain(peso(240_000))
    expect(r['Taxable income']).toBe(peso(360_000))
    expect(Object.keys(r)).not.toContain('Other income')
  })

  it('names itemized expenses instead', () => {
    const r = rowsFor(annualResults.graduated({ ...business, deduction: 'itemized', itemizedExpenses: 100_000 }))
    expect(r['Itemized expenses']).toContain(peso(100_000))
    expect(r['Taxable income']).toBe(peso(500_000))
    expect(Object.keys(r)).not.toContain('40% deduction')
  })

  it('adds other income, which the deduction does not apply to', () => {
    const r = rowsFor(annualResults.graduated({ ...business, otherNonOperatingIncome: 50_000 }))
    expect(r['Other income']).toContain(peso(50_000))
    expect(r['Other income']).toContain('plus')
    expect(r['Gross income']).toBe(peso(650_000))
    expect(r['Taxable income']).toBe(peso(410_000))
  })

  it('taxes pay and business together once, so there is no separate tax on pay', () => {
    const r = rowsFor(annualResults.graduated(business, [salaryJob]))
    expect(Object.keys(r)).not.toContain('Tax on pay')
    expect(r['Taxable income']).toBe(peso(590_000 + 360_000))
    expect(r['40% deduction']).toContain(peso(240_000))
    expect(r['SSS, PhilHealth, Pag-IBIG']).toContain(peso(20_000))
  })
})

describe('Receipt: what is left to pay', () => {
  it('shows an overpayment when the credits are more than the tax', () => {
    const r = rowsFor(annualResults.employee({ ...salaryJob, taxWithheld: 500_000 }))
    expect(Object.keys(r)).toContain('Overpaid')
    expect(Object.keys(r)).not.toContain('To pay')
  })
})

describe('Receipt: the reduction hint', () => {
  const open = async (result: AnnualReturnResult) => {
    // A tip is placed with a ResizeObserver, which jsdom does not have.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    rowsFor(result)
    fireEvent.click(screen.getByRole('button', { name: 'More about Reduction' }))
    return (await screen.findAllByText(/is not taxed under the 8% option/))[0].textContent
  }

  it('gives the amount from the rules', async () => {
    expect(await open(annualResults.eightPercent({ grossReceipts: 600_000 }))).toBe(
      `The first ${peso(250_000)} is not taxed under the 8% option.`,
    )
  })

  it('says it is not allowed next to a salary', async () => {
    expect(await open(annualResults.eightPercent({ grossReceipts: 600_000 }, [salaryJob]))).toBe(
      `The first ${peso(250_000)} is not taxed under the 8% option. It is not allowed when you also earn a salary.`,
    )
  })
})
