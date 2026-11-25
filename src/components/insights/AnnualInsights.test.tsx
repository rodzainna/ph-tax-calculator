// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { annualResults, salaryJob } from '@/test/annualResults.ts'
import AnnualInsights from './AnnualInsights.tsx'

beforeEach(() => {
  // Radix measures an open tip with a ResizeObserver, which jsdom does not have.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const show = (outcome: AnnualOutcome) =>
  render(
    <TooltipProvider>
      <AnnualInsights outcome={outcome} />
    </TooltipProvider>,
  )

const showResult = (result: AnnualReturnResult) => show({ ok: true, result, details: [], notes: [] })

/** The figure on the tile with this label. */
const tile = (label: string) =>
  screen
    .getByRole('button', { name: `More about ${label}` })
    .closest('[data-slot="card"]')!
    .querySelector('.font-mono')!.textContent

const tip = (label: string) => {
  // A click alone: userEvent hovers first, and a tip opened by the hover would be closed again by the click.
  fireEvent.click(screen.getByRole('button', { name: `More about ${label}` }))
  return screen.getByRole('tooltip').textContent
}

const bracketCard = () => screen.queryByText('Your tax bracket')

describe('AnnualInsights: no estimate', () => {
  it.each([
    ['nothing is entered', { ok: false, message: '', empty: true } as const],
    ['something is wrong', { ok: false, message: 'Something is off' } as const],
  ])('shows nothing while %s', (_when, outcome) => {
    const { container } = show(outcome)
    expect(container.textContent).toBe('')
  })
})

describe('AnnualInsights: a salary', () => {
  // 600,000 pay - 20,000 contributions + 10,000 of bonuses over the exempt 90,000 = 590,000 taxable.
  // The tax is 22,500 + 20% of 190,000 = 60,500, which is 8.6% of the 700,000 received.
  // Without the 10,000 of bonuses it is 58,500.
  it('shows the tax, its share of the pay, and the tax on the bonuses', () => {
    showResult(annualResults.employee())
    expect(tile('Annual tax')).toBe('₱60,500')
    expect(tile('Effective rate')).toBe('8.6%')
    expect(tile('Bonus tax')).toBe('₱2,000')
    expect(screen.queryByText('Tax option')).toBeNull()
  })

  it('explains the bonus tax with the exempt amount', () => {
    showResult(annualResults.employee())
    expect(tip('Bonus tax')).toContain('above the ₱90,000.00 exempt amount')
  })

  it('places the taxable income in the tax table', () => {
    showResult(annualResults.employee())
    expect(screen.getByText('₱590,000.00')).toBeTruthy()
    expect(screen.getByText('annual taxable income')).toBeTruthy()
    expect(screen.getByText('20% on the excess')).toBeTruthy()
  })
})

describe('AnnualInsights: business income only', () => {
  // 700,000 - 40% = 420,000 net. The tax is 22,500 + 20% of 20,000 = 26,500, which is 3.8% of the receipts.
  it('names the graduated rates and places the net income in the table', () => {
    showResult(annualResults.graduated({ grossReceipts: 700_000 }))
    expect(tile('Annual tax')).toBe('₱26,500')
    expect(tile('Effective rate')).toBe('3.8%')
    expect(tile('Tax option')).toBe('Graduated')
    expect(tip('Tax option')).toBe('The graduated rates on what is left after your deduction.')
    expect(screen.getByText('₱420,000.00')).toBeTruthy()
    expect(screen.queryByText('Bonus tax')).toBeNull()
  })

  // 8% of 600,000 - 250,000 = 28,000, which is 4.7% of the receipts.
  it('names the 8% option and its reduction, with no tax table', () => {
    showResult(annualResults.eightPercent({ grossReceipts: 600_000 }))
    expect(tile('Annual tax')).toBe('₱28,000')
    expect(tile('Effective rate')).toBe('4.7%')
    expect(tile('Tax option')).toBe('8% flat')
    expect(tip('Tax option')).toContain('above ₱250,000,')
    expect(bracketCard()).toBeNull()
  })
})

describe('AnnualInsights: a salary and a business', () => {
  it('places only the pay in the table with the 8% option, and says so', () => {
    showResult(annualResults.eightPercent({ grossReceipts: 600_000 }, [salaryJob]))
    expect(tile('Bonus tax')).toBe('₱2,000')
    expect(screen.getByText('₱590,000.00')).toBeTruthy()
    expect(screen.getByText('taxable pay (8% part taxed apart)')).toBeTruthy()
  })

  it('does not mention an 8% part while there are no receipts', () => {
    showResult(annualResults.eightPercent({ grossReceipts: 0 }, [salaryJob]))
    expect(screen.getByText('annual taxable income')).toBeTruthy()
    expect(screen.queryByText(/8% part/)).toBeNull()
  })

  it.each([
    ['no pay yet', 0],
    ['pay in the first bracket', 200_000],
  ])('says only that the pay is untaxed, with %s', (_when, regularPay) => {
    const job = { ...salaryJob, regularPay, thirteenthMonthAndBenefits: 0, mandatoryContributions: 0 }
    showResult(annualResults.eightPercent({ grossReceipts: 600_000 }, [job]))
    expect(tile('Annual tax')).toBe('₱48,000')
    expect(screen.getByText('No tax on your pay')).toBeTruthy()
    expect(screen.queryByText('No income tax')).toBeNull()
  })

  it('says there is no income tax when nothing else is taxed either', () => {
    showResult(annualResults.graduated({ grossReceipts: 200_000 }))
    expect(screen.getByText('No income tax')).toBeTruthy()
  })

  // A loss of 600,000 against 590,000 of taxable pay leaves -10,000, so no tax is due on the bonuses either.
  it('shows no tax when a business loss is larger than the taxable pay', () => {
    showResult(
      annualResults.graduated({ grossReceipts: 100_000, deduction: 'itemized', itemizedExpenses: 700_000 }, [
        salaryJob,
      ]),
    )
    expect([tile('Annual tax'), tile('Effective rate'), tile('Bonus tax')]).toEqual(['₱0', '0.0%', '₱0'])
    expect(screen.getByText('-₱10,000.00')).toBeTruthy()
    expect(screen.getByText('No income tax')).toBeTruthy()
  })

  // 590,000 of taxable pay + 360,000 of net business income.
  it('places the pay and the business together with graduated rates', () => {
    showResult(annualResults.graduated({ grossReceipts: 600_000 }, [salaryJob]))
    expect(screen.getByText('₱950,000.00')).toBeTruthy()
    expect(screen.getByText('annual taxable income')).toBeTruthy()
  })
})
