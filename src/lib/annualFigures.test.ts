import { describe, expect, it } from 'vitest'
import { annualReturnWithEightPercent, annualReturnWithGraduated } from '../engine/annualReturn.ts'
import type { EmployerCompensation } from '../engine/compensationTax.ts'
import { bracketIncome, deductions, effectiveRate, grossIncome, taxableIncome, taxOnBenefits } from './annualFigures.ts'

/** Made-up figures. Expected values are worked out by hand. */
const employer = (
  regularPay: number,
  thirteenth: number,
  contributions: number,
  withheld = 0,
): EmployerCompensation => ({
  label: 'Employer',
  regularPay,
  thirteenthMonthAndBenefits: thirteenth,
  deMinimisExcess: 0,
  mandatoryContributions: contributions,
  taxWithheld: withheld,
})

describe('employee only (150,000 a month, 2026)', () => {
  // The same person as the monthly page: 1,800,000 pay + 150,000 13th month, 53,400 contributions.
  const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(1_800_000, 150_000, 53_400)] })

  it('gross income is pay plus the 13th month', () => {
    expect(grossIncome(r)).toBe(1_950_000)
  })

  it('deductions are the contributions and the exempt 90,000', () => {
    const d = deductions(r)
    expect(d.contributions).toBe(53_400)
    expect(d.exemptBenefits).toBe(90_000)
    expect(d.business).toBe(0)
    expect(d.total).toBe(143_400)
  })

  it('gross minus deductions is the taxable income the engine used', () => {
    expect(taxableIncome(r)).toBe(1_806_600)
    expect(grossIncome(r) - deductions(r).total).toBe(taxableIncome(r))
  })

  it('effective rate is tax over gross: 354,150 / 1,950,000', () => {
    expect(r.totalTaxDue).toBe(354_150)
    expect(effectiveRate(r)).toBeCloseTo(0.1816, 4)
  })

  it('tax on bonuses: 25% of the taxable 60,000, the same as the monthly page', () => {
    expect(taxOnBenefits(r)).toBe(15_000)
  })

  it('the bracket bar uses the pay taxable income', () => {
    expect(bracketIncome(r)).toBe(1_806_600)
  })
})

describe('tax on bonuses is in whole pesos, like the return', () => {
  // 310,000 pay + 100,007 13th month: 10,007 taxable. Tax with it 10,501.05 -> 10,501, without 9,000: the difference is 1,501.
  it('is the difference of the two whole-peso taxes, not of the centavo taxes', () => {
    const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(310_000, 100_007, 0)] })
    expect(taxOnBenefits(r)).toBe(1_501)
  })

  it('is 0 when the centavos alone would have made it 0.15', () => {
    const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(300_001, 90_001, 0)] })
    expect(taxOnBenefits(r)).toBe(0)
  })
})

describe('13th month under the ceiling', () => {
  it('has no tax on bonuses and exempts the whole 13th month', () => {
    // 35,000 a month: 420,000 pay + 35,000 13th month, 33,900 contributions
    const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(420_000, 35_000, 33_900)] })
    expect(taxableIncome(r)).toBe(386_100)
    expect(deductions(r).exemptBenefits).toBe(35_000)
    expect(taxOnBenefits(r)).toBe(0)
    expect(r.totalTaxDue).toBe(20_415)
    expect(effectiveRate(r)).toBeCloseTo(0.0449, 3)
  })
})

describe('self-employed', () => {
  it('8%: gross is the receipts, the deduction is the 250,000, taxable is the rest, and there is no bracket', () => {
    const r = annualReturnWithEightPercent({ year: 2026, business: { grossReceipts: 1_200_000 } })
    expect(grossIncome(r)).toBe(1_200_000)
    expect(deductions(r).business).toBe(250_000)
    expect(taxableIncome(r)).toBe(950_000)
    expect(r.totalTaxDue).toBe(76_000)
    expect(bracketIncome(r)).toBeNull()
    expect(taxOnBenefits(r)).toBe(0)
  })

  it('graduated with the 40% deduction: gross 1,200,000, deduction 480,000, taxable 720,000', () => {
    const r = annualReturnWithGraduated({ year: 2026, business: { grossReceipts: 1_200_000 } })
    expect(grossIncome(r)).toBe(1_200_000)
    expect(deductions(r).business).toBe(480_000)
    expect(taxableIncome(r)).toBe(720_000)
    expect(grossIncome(r) - deductions(r).total).toBe(taxableIncome(r))
    expect(bracketIncome(r)).toBe(720_000)
  })

  it('itemized expenses above the receipts: a loss, so the taxable income is negative and it still adds up', () => {
    const r = annualReturnWithGraduated({
      year: 2026,
      business: { grossReceipts: 100_000, deduction: 'itemized', itemizedExpenses: 150_000 },
    })
    expect(taxableIncome(r)).toBe(-50_000)
    expect(deductions(r).business).toBe(150_000)
    expect(grossIncome(r) - deductions(r).total).toBe(taxableIncome(r))
  })
})

describe('mixed income', () => {
  it('graduated: one taxable income over pay and business, and the bar uses the combined figure', () => {
    // pay 400,000 (no 13th month, no contributions) + business 500,000 at 40% off = 300,000 -> 700,000
    const r = annualReturnWithGraduated({
      year: 2026,
      employers: [employer(400_000, 0, 0)],
      business: { grossReceipts: 500_000 },
    })
    expect(grossIncome(r)).toBe(900_000)
    expect(taxableIncome(r)).toBe(700_000)
    expect(deductions(r).total).toBe(200_000)
    expect(bracketIncome(r)).toBe(700_000)
    expect(r.totalTaxDue).toBe(82_500)
  })

  it('graduated: tax on bonuses is worked out on the combined income, so a higher bracket applies', () => {
    // pay 400,000 + 150,000 13th month (60,000 taxable) + business 700,000 at 40% off = 420,000 -> 880,000.
    // All the taxable 60,000 sits above 800,000, so it is taxed at 25% (15,000), not at the 20% it would face next to the pay alone (12,000).
    const r = annualReturnWithGraduated({
      year: 2026,
      employers: [employer(400_000, 150_000, 0)],
      business: { grossReceipts: 700_000 },
    })
    expect(r.combinedTaxableIncome).toBe(880_000)
    expect(taxOnBenefits(r)).toBe(15_000)
  })

  it('8%: pay and business are taxed apart, so the bar shows the pay only', () => {
    const r = annualReturnWithEightPercent({
      year: 2026,
      employers: [employer(400_000, 0, 0)],
      business: { grossReceipts: 600_000 },
    })
    expect(bracketIncome(r)).toBe(400_000)
    // no 250,000 reduction because there is also pay
    expect(deductions(r).business).toBe(0)
    expect(taxableIncome(r)).toBe(1_000_000)
    expect(grossIncome(r)).toBe(1_000_000)
  })
})

describe('centavos typed in', () => {
  it('gross minus deductions is within half a peso of the taxable income, which the engine rounds', () => {
    // 100,000.40 pay and 0.10 contributions: 100,000.30 before rounding, 100,000 as a whole peso.
    const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(100_000.4, 0, 0.1)] })
    expect(taxableIncome(r)).toBe(100_000)
    expect(grossIncome(r) - deductions(r).total).toBeCloseTo(100_000.3, 2)
    expect(Math.abs(grossIncome(r) - deductions(r).total - taxableIncome(r))).toBeLessThan(0.5)
  })
})

describe('graduated business income without the combined figure', () => {
  // The engine always sets it; a result built some other way still gets the same answers.
  const r = annualReturnWithGraduated({
    year: 2026,
    employers: [employer(400_000, 150_000, 0)],
    business: { grossReceipts: 700_000 },
  })
  const without = { ...r, combinedTaxableIncome: null }

  it('works the combined income out from pay and net business income', () => {
    expect(bracketIncome(without)).toBe(880_000)
    expect(taxOnBenefits(without)).toBe(15_000)
  })
})

describe('guards', () => {
  it('a result with nothing received has an effective rate of 0', () => {
    const r = annualReturnWithEightPercent({ year: 2026, employers: [employer(0, 0, 0)] })
    expect(effectiveRate(r)).toBe(0)
  })
})
