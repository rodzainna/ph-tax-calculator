import { describe, expect, it } from 'vitest'
import { annualReturnWithEightPercent, annualReturnWithGraduated } from './annualReturn.ts'
import type { EmployerCompensation } from './compensationTax.ts'

/** Made-up taxpayers; every expected value is worked out by hand. */
const employer = (o: Partial<EmployerCompensation> = {}): EmployerCompensation => ({
  label: 'Employer',
  regularPay: 0,
  thirteenthMonthAndBenefits: 0,
  deMinimisExcess: 0,
  mandatoryContributions: 0,
  taxWithheld: 0,
  ...o,
})

describe('mixed income (form 1701): compensation graduated + business 8%', () => {
  const input = {
    year: 2024,
    employers: [employer({ regularPay: 400_000, mandatoryContributions: 12_000, taxWithheld: 20_000 })],
    business: { grossReceipts: 600_000, quarterlyTaxPaid: 30_000, creditableWithholding: 5_000 },
  }

  it('adds the two taxes and subtracts all credits', () => {
    const r = annualReturnWithEightPercent(input)
    expect(r.form).toBe('1701')
    // compensation: 400,000 - 12,000 = 388,000 -> 15% x 138,000 = 20,700
    expect(r.compensation?.taxDue).toBe(20_700)
    // business: 8% x 600,000 = 48,000, with NO 250,000 reduction because there is compensation
    expect(r.business?.reduction).toBe(0)
    expect(r.business?.tax).toBe(48_000)
    expect(r.totalTaxDue).toBe(68_700)
    // credits: 20,000 withheld + 30,000 1701Q + 5,000 2307 = 55,000
    expect(r.totalCredits).toBe(55_000)
    expect(r.balance).toBe(13_700)
  })

  it('keeps a client withholding without a 2307 separate from the balance', () => {
    const r = annualReturnWithEightPercent({
      ...input,
      business: { ...input.business, creditableWithholding: 0, pendingCreditableWithholding: 4_000 },
    })
    // the 5,000 certified credit is gone, so credits fall to 50,000
    expect(r.balance).toBe(18_700)
    expect(r.pendingCredit).toBe(4_000)
    expect(r.balanceIfPendingCreditAllowed).toBe(14_700)
  })

  it('reports an overpayment as a negative balance', () => {
    const r = annualReturnWithEightPercent({
      year: 2024,
      employers: [employer({ regularPay: 300_000, taxWithheld: 30_000 })],
      business: { grossReceipts: 100_000, quarterlyTaxPaid: 8_000 },
    })
    // compensation: 15% x 50,000 = 7,500; business 8% x 100,000 = 8,000; credits 38,000
    expect(r.totalTaxDue).toBe(15_500)
    expect(r.balance).toBe(-22_500)
  })
})

describe('single-source returns', () => {
  it('compensation only behaves like the 1700', () => {
    const r = annualReturnWithEightPercent({
      year: 2024,
      employers: [
        employer({
          regularPay: 600_000,
          mandatoryContributions: 20_000,
          thirteenthMonthAndBenefits: 50_000,
          taxWithheld: 50_000,
        }),
      ],
    })
    expect(r.form).toBe('1700')
    expect(r.business).toBeNull()
    expect(r.totalTaxDue).toBe(58_500)
    expect(r.balance).toBe(8_500)
  })

  it('business only behaves like the 1701A and gets the 250,000 reduction', () => {
    const r = annualReturnWithEightPercent({ year: 2024, business: { grossReceipts: 600_000 } })
    expect(r.form).toBe('1701A')
    expect(r.compensation).toBeNull()
    expect(r.business?.reduction).toBe(250_000)
    expect(r.totalTaxDue).toBe(28_000) // 8% x 350,000
    expect(r.balance).toBe(28_000)
  })
})

describe('validation', () => {
  it('needs some income', () => {
    expect(() => annualReturnWithEightPercent({ year: 2024 })).toThrow(RangeError)
    expect(() => annualReturnWithEightPercent({ year: 2024, employers: [] })).toThrow(RangeError)
  })

  it('rejects negative credits', () => {
    expect(() =>
      annualReturnWithEightPercent({ year: 2024, business: { grossReceipts: 100_000, quarterlyTaxPaid: -1 } }),
    ).toThrow(/quarterlyTaxPaid/)
  })
})

describe('graduated rates for business income (40% optional standard deduction)', () => {
  it('business only: 40% off gross, then the graduated table on the rest', () => {
    const r = annualReturnWithGraduated({ year: 2026, business: { grossReceipts: 1_000_000 } })
    // 1,000,000 - 400,000 = 600,000; tax = 22,500 + 20% x 200,000 = 62,500
    expect(r.form).toBe('1701A')
    expect(r.combinedTaxableIncome).toBe(600_000)
    expect(r.totalTaxDue).toBe(62_500)
    expect(r.business).toBeNull()
    expect(r.graduatedBusiness?.deduction).toBe(400_000)
  })

  it('business only: no tax when net income is within the 250,000 zero bracket', () => {
    // 400,000 x 60% = 240,000
    const r = annualReturnWithGraduated({ year: 2026, business: { grossReceipts: 400_000 } })
    expect(r.totalTaxDue).toBe(0)
  })

  it('mixed income: taxable pay and net business income share one graduated computation', () => {
    const r = annualReturnWithGraduated({
      year: 2026,
      employers: [
        {
          label: 'Employer',
          regularPay: 400_000,
          thirteenthMonthAndBenefits: 0,
          deMinimisExcess: 0,
          mandatoryContributions: 0,
          taxWithheld: 20_000,
        },
      ],
      business: { grossReceipts: 500_000, quarterlyTaxPaid: 5_000 },
    })
    // taxable pay 400,000 + business 500,000 x 60% = 300,000 -> 700,000
    // tax = 22,500 + 20% x 300,000 = 82,500 (not 22,500 + 0, which two separate computations would give)
    expect(r.form).toBe('1701')
    expect(r.combinedTaxableIncome).toBe(700_000)
    expect(r.totalTaxDue).toBe(82_500)
    expect(r.totalCredits).toBe(25_000)
    expect(r.balance).toBe(57_500)
  })

  it('has no 8% limit: business income over 3,000,000 works', () => {
    const r = annualReturnWithGraduated({ year: 2026, business: { grossReceipts: 4_000_000 } })
    // 4,000,000 x 60% = 2,400,000; tax = 402,500 + 30% x 400,000 = 522,500
    expect(r.totalTaxDue).toBe(522_500)
  })

  it('counts 2307 credit and 1701Q payments, and keeps the pending credit separate', () => {
    const r = annualReturnWithGraduated({
      year: 2026,
      business: {
        grossReceipts: 1_000_000,
        quarterlyTaxPaid: 10_000,
        creditableWithholding: 5_000,
        pendingCreditableWithholding: 3_000,
      },
    })
    expect(r.totalCredits).toBe(15_000)
    expect(r.balance).toBe(47_500)
    expect(r.balanceIfPendingCreditAllowed).toBe(44_500)
  })

  it('needs something to compute', () => {
    expect(() => annualReturnWithGraduated({ year: 2026 })).toThrow(RangeError)
  })
})

describe('graduated rates with itemized expenses', () => {
  it('uses the expenses, not 40%, and can beat the standard deduction', () => {
    const r = annualReturnWithGraduated({
      year: 2026,
      business: { grossReceipts: 1_000_000, deduction: 'itemized', itemizedExpenses: 700_000 },
    })
    // 1,000,000 - 700,000 = 300,000; tax = 15% x 50,000 = 7,500 (the 40% deduction would give 62,500)
    expect(r.combinedTaxableIncome).toBe(300_000)
    expect(r.totalTaxDue).toBe(7_500)
    expect(r.graduatedBusiness?.deductionKind).toBe('itemized')
  })
})
