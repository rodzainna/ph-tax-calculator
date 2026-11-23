import { describe, expect, it } from 'vitest'
import { benefitsCeilingFor, compensationTax, type EmployerCompensation } from './compensationTax.ts'
import { UnsupportedYearError } from './graduatedTax.ts'

/** Made-up employers. Expected values are worked out by hand from the statute. */
const employer = (overrides: Partial<EmployerCompensation> = {}): EmployerCompensation => ({
  label: 'Employer',
  regularPay: 0,
  thirteenthMonthAndBenefits: 0,
  deMinimisExcess: 0,
  mandatoryContributions: 0,
  taxWithheld: 0,
  ...overrides,
})

describe('one employer', () => {
  it('taxes regular pay less contributions; a benefits pool under the ceiling stays exempt', () => {
    const result = compensationTax(
      [
        employer({
          regularPay: 600_000,
          thirteenthMonthAndBenefits: 50_000,
          mandatoryContributions: 20_000,
          taxWithheld: 50_000,
        }),
      ],
      2024,
    )
    // 600,000 - 20,000 = 580,000 taxable; pool 50,000 is under 90,000, so fully exempt.
    expect(result.taxableCompensation).toBe(580_000)
    expect(result.benefitsExempt).toBe(50_000)
    expect(result.benefitsTaxable).toBe(0)
    // 22,500 + 20% x (580,000 - 400,000) = 58,500
    expect(result.taxDue).toBe(58_500)
    expect(result.balance).toBe(8_500) // payable
  })

  it('reports an overpayment as a negative balance', () => {
    const result = compensationTax(
      [employer({ regularPay: 300_000, mandatoryContributions: 10_000, taxWithheld: 12_000 })],
      2024,
    )
    // taxable 290,000 -> 15% x 40,000 = 6,000; withheld 12,000
    expect(result.taxDue).toBe(6_000)
    expect(result.balance).toBe(-6_000)
  })
})

describe('the P90,000 benefits pool is shared across employers', () => {
  const two = [
    employer({
      label: 'A',
      regularPay: 300_000,
      thirteenthMonthAndBenefits: 60_000,
      mandatoryContributions: 10_000,
      taxWithheld: 15_000,
    }),
    employer({
      label: 'B',
      regularPay: 350_000,
      thirteenthMonthAndBenefits: 50_000,
      mandatoryContributions: 12_000,
      taxWithheld: 20_000,
    }),
  ]

  it('exempts 90,000 in total and taxes the rest, even though each employer is under 90,000', () => {
    const result = compensationTax(two, 2024)
    expect(result.benefitsPool).toBe(110_000)
    expect(result.benefitsExempt).toBe(90_000)
    expect(result.benefitsTaxable).toBe(20_000)
    // 650,000 regular - 22,000 contributions + 20,000 taxable benefits = 648,000
    expect(result.taxableCompensation).toBe(648_000)
    // 22,500 + 20% x 248,000 = 72,100
    expect(result.taxDue).toBe(72_100)
    expect(result.totalTaxWithheld).toBe(35_000)
    expect(result.balance).toBe(37_100)
  })

  it('keeps every employer in the result', () => {
    const result = compensationTax(two, 2024)
    expect(result.employers.map((e) => e.label)).toEqual(['A', 'B'])
  })

  it('treats a pool of exactly 90,000 as fully exempt and one centavo over as taxable', () => {
    const exactly = compensationTax([employer({ regularPay: 300_000, thirteenthMonthAndBenefits: 90_000 })], 2024)
    expect(exactly.benefitsTaxable).toBe(0)
    const over = compensationTax([employer({ regularPay: 300_000, thirteenthMonthAndBenefits: 90_000.01 })], 2024)
    expect(over.benefitsTaxable).toBe(0.01)
  })
})

describe('excess de minimis joins the benefits pool', () => {
  it('adds de minimis above its ceilings to the pool', () => {
    const result = compensationTax(
      [
        employer({
          regularPay: 500_000,
          thirteenthMonthAndBenefits: 40_000,
          deMinimisExcess: 55_000,
          mandatoryContributions: 15_000,
          taxWithheld: 45_000,
        }),
      ],
      2024,
    )
    expect(result.benefitsPool).toBe(95_000)
    expect(result.benefitsTaxable).toBe(5_000)
    // 500,000 - 15,000 + 5,000 = 490,000; 22,500 + 20% x 90,000 = 40,500
    expect(result.taxableCompensation).toBe(490_000)
    expect(result.taxDue).toBe(40_500)
    expect(result.balance).toBe(-4_500) // overpaid
  })
})

describe('tax year and edge cases', () => {
  it('uses the graduated table of the tax year', () => {
    const e = [employer({ regularPay: 500_000 })]
    expect(compensationTax(e, 2022).taxDue).toBe(55_000)
    expect(compensationTax(e, 2023).taxDue).toBe(42_500)
  })

  it('returns zeros for no employers', () => {
    const result = compensationTax([], 2024)
    expect(result.taxableCompensation).toBe(0)
    expect(result.taxDue).toBe(0)
    expect(result.balance).toBe(0)
  })

  it('has a 90,000 ceiling from 2018 and refuses earlier years', () => {
    expect(benefitsCeilingFor(2018)).toBe(90_000)
    expect(benefitsCeilingFor(2026)).toBe(90_000)
    expect(() => benefitsCeilingFor(2017)).toThrow(UnsupportedYearError)
    expect(() => compensationTax([employer({ regularPay: 100_000 })], 2017)).toThrow(UnsupportedYearError)
  })

  it('rejects negative or non-numeric amounts and names the field', () => {
    expect(() => compensationTax([employer({ label: 'X', regularPay: -1 })], 2024)).toThrow(/X: regularPay/)
    expect(() => compensationTax([employer({ taxWithheld: Number.NaN })], 2024)).toThrow(RangeError)
  })

  it('does not drift on cents (sums are rounded)', () => {
    const result = compensationTax(
      [employer({ regularPay: 0.1 }), employer({ regularPay: 0.2 }), employer({ regularPay: 0.3 })],
      2024,
    )
    expect(result.totalRegularPay).toBe(0.6)
  })
})
