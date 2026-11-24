import { describe, expect, it } from 'vitest'
import { annualReturnWithEightPercent, annualReturnWithGraduated } from './annualReturn.ts'
import { eightPercentTax, EightPercentNotAvailableError } from './eightPercentTax.ts'
import { graduatedTaxToPeso, UnsupportedYearError } from './graduatedTax.ts'
import { roundToCentavos, roundToPeso } from './money.ts'
import { monthlyPay } from './monthlyPay.ts'
import { annualBasicPay, monthlyBasicSalary, thirteenthMonthPay } from './pay.ts'

// The annual return follows the BIR's offline eBIRForms 1701/1700: every computed line is a whole peso (Math.round),
// and a business loss lowers the combined taxable income. The numbers below are made up in the shape of a real filing.

const employer = (
  overrides: Partial<
    Parameters<typeof annualReturnWithEightPercent>[0]['employers'] extends (infer E)[] | undefined ? E : never
  > = {},
) => ({
  label: 'Employer',
  regularPay: 0,
  thirteenthMonthAndBenefits: 0,
  deMinimisExcess: 0,
  mandatoryContributions: 0,
  taxWithheld: 0,
  ...overrides,
})

describe('whole-peso rounding like the form', () => {
  it('rounds halves up, and never returns negative zero', () => {
    expect(roundToPeso(0.5)).toBe(1)
    expect(roundToPeso(9_184.5)).toBe(9_185)
    expect(roundToPeso(2.4999)).toBe(2)
    expect(Object.is(roundToPeso(-0.4), 0)).toBe(true)
    expect(Object.is(roundToCentavos(-1e-14), 0)).toBe(true)
  })

  it('rounds the taxable income and then the tax: 311,230.07 gives 9,185, as on the form', () => {
    expect(graduatedTaxToPeso(311_230.07, 2025)).toBe(9_185)
    expect(graduatedTaxToPeso(311_230.95, 2025)).toBe(9_185)
  })

  it('mixed income with the 8% option: pay is taxed graduated, the whole gross at 8%, credits and balance in whole pesos', () => {
    const r = annualReturnWithEightPercent({
      year: 2025,
      employers: [employer({ regularPay: 352_430.57, mandatoryContributions: 41_200.5, taxWithheld: 9_184.51 })],
      business: { grossReceipts: 1_200_000.4, quarterlyTaxPaid: 30_000.49, creditableWithholding: 5_000.3 },
    })
    expect(r.compensation?.taxableCompensation).toBe(311_230)
    expect(r.compensation?.taxDue).toBe(9_185)
    expect(r.business?.base).toBe(1_200_000)
    expect(r.business?.tax).toBe(96_000)
    expect(r.totalTaxDue).toBe(105_185)
    expect(r.totalCredits).toBe(44_185)
    expect(r.balance).toBe(61_000)
  })

  it('the 8% limit is counted on the whole-peso total', () => {
    expect(() => eightPercentTax({ grossReceipts: 3_000_000.49, purelySelfEmployed: true }, 2025)).not.toThrow()
    expect(() => eightPercentTax({ grossReceipts: 3_000_000.5, purelySelfEmployed: true }, 2025)).toThrow(
      EightPercentNotAvailableError,
    )
  })
})

describe('a business loss, like the form', () => {
  it('lowers the combined taxable income instead of being set to zero', () => {
    const r = annualReturnWithGraduated({
      year: 2025,
      employers: [employer({ regularPay: 700_000, mandatoryContributions: 100_000 })],
      business: { grossReceipts: 100_000, deduction: 'itemized', itemizedExpenses: 200_000 },
    })
    expect(r.graduatedBusiness?.netBusinessIncome).toBe(-100_000)
    expect(r.combinedTaxableIncome).toBe(500_000)
    // 22,500 + 20% of the 100,000 over 400,000
    expect(r.totalTaxDue).toBe(42_500)
  })

  it('a loss with no pay owes no tax', () => {
    const r = annualReturnWithGraduated({
      year: 2025,
      business: { grossReceipts: 50_000, deduction: 'itemized', itemizedExpenses: 80_000 },
    })
    expect(r.combinedTaxableIncome).toBe(-30_000)
    expect(r.totalTaxDue).toBe(0)
  })
})

describe('yearly pay', () => {
  it('rounds once, so a yearly salary comes back whole', () => {
    const yearly = { amount: 100_000, frequency: 'yearly' as const, monthsWorked: 12 }
    expect(monthlyBasicSalary(yearly)).toBe(8_333.33)
    expect(annualBasicPay(yearly)).toBe(100_000)
    expect(thirteenthMonthPay(yearly)).toBe(8_333.33)
    expect(annualBasicPay({ ...yearly, monthsWorked: 6 })).toBe(50_000)
  })
})

describe('errors for years without rules', () => {
  it('names the year and does not blame the graduated table', () => {
    expect(() => eightPercentTax({ grossReceipts: 1, purelySelfEmployed: true }, 2017)).toThrow(UnsupportedYearError)
    expect(() => eightPercentTax({ grossReceipts: 1, purelySelfEmployed: true }, 2017)).toThrow(/2017/)
    expect(() => eightPercentTax({ grossReceipts: 1, purelySelfEmployed: true }, 2017)).not.toThrow(/graduated/)
  })
})

describe('minimum wage earner', () => {
  it('pays no income tax but still pays contributions', () => {
    const normal = monthlyPay({ year: 2026, monthlyBasic: 35_000 })
    const exempt = monthlyPay({ year: 2026, monthlyBasic: 35_000, isMinimumWageEarner: true })
    expect(normal.taxMonthly).toBeGreaterThan(0)
    expect(exempt.taxYearly).toBe(0)
    expect(exempt.taxMonthly).toBe(0)
    expect(exempt.taxableIncomeYearly).toBe(0)
    expect(exempt.taxOnBonuses).toBe(0)
    expect(exempt.contributions).toBe(normal.contributions)
    expect(exempt.takeHomeMonthly).toBe(exempt.grossMonthly - exempt.contributions)
  })
})
