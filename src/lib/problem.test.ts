import { describe, expect, it } from 'vitest'
import { computeScenario } from './computeScenario.ts'
import { monthlyOutcome } from './monthlyOutcome.ts'
import { initialForm, withTaxpayer, yearEndScenario } from './yearForm.ts'

const selfEmployed = { type: 'self-employed', method: 'eight-percent' } as const

/** The Monthly page's outcome for a self-employed person on the 8% option. */
const monthly = (income: string) =>
  monthlyOutcome({
    year: 2026,
    taxpayer: selfEmployed,
    basic: income,
    allowance: '',
    deMinimis: '',
    bonus: '',
    minimumWage: false,
    paysSss: false,
    paysPhilhealth: false,
    pagibig: '',
  })

/** The Annual page's outcome for the same income, received every month of the year. */
const annual = (income: string) => {
  const base = withTaxpayer({ ...initialForm(), year: 2026, asOf: '2026-12-31' }, selfEmployed)
  const form = { ...base, business: { ...base.business, amount: income, frequency: 'month' as const } }
  return computeScenario(form, yearEndScenario(form.year))
}

describe('the 8% option over its limit', () => {
  it('reads the same on the Monthly and Annual pages', () => {
    const message =
      'The 8% option only covers up to ₱3,000,000.00 a year. Your business income for the year is ₱84,000,000.00, ' +
      'so the 8% option is not available. Choose Graduated rates instead.'
    expect(monthly('7000000')).toEqual({ ok: false, message })
    expect(annual('7000000')).toEqual({ ok: false, message })
  })
})
