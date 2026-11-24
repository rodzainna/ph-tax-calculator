import { describe, expect, it } from 'vitest'
import { selfEmployedContributions } from './contributions.ts'
import { EightPercentNotAvailableError } from './eightPercentTax.ts'
import { selfEmployedMonthlyPay } from './selfEmployedMonthly.ts'

/** Expected values are worked out by hand from the rules, not copied from the code. */
describe('selfEmployedContributions (member pays everything)', () => {
  it('2026: SSS is 15% of the MSC and PhilHealth 5% of income', () => {
    // income 30,000 -> MSC 30,000 -> SSS 4,500; PhilHealth 30,000 x 5% = 1,500
    const c = selfEmployedContributions(2026, 12, { monthlyIncome: 30_000 })
    expect(c.sss).toEqual({ msc: 30_000, total: 4_500 })
    expect(c.philhealth).toBe(1_500)
  })

  it('caps SSS at MSC 35,000 and PhilHealth at 100,000 income (2026)', () => {
    const c = selfEmployedContributions(2026, 12, { monthlyIncome: 200_000 })
    expect(c.sss).toEqual({ msc: 35_000, total: 5_250 })
    expect(c.philhealth).toBe(5_000)
  })

  it('uses the floors for small incomes (2026)', () => {
    // MSC floor 5,000 x 15% = 750; PhilHealth floor 10,000 x 5% = 500
    const c = selfEmployedContributions(2026, 12, { monthlyIncome: 2_000 })
    expect(c.sss).toEqual({ msc: 5_000, total: 750 })
    expect(c.philhealth).toBe(500)
  })

  it('uses the rate of the year: 2023 SSS is 14% with MSC up to 30,000', () => {
    const c = selfEmployedContributions(2023, 6, { monthlyIncome: 50_000 })
    expect(c.sss).toEqual({ msc: 30_000, total: 4_200 })
    // 2023 PhilHealth: 4% up to 80,000
    expect(c.philhealth).toBe(2_000)
  })
})

describe('selfEmployedMonthlyPay', () => {
  it('8%: tax is (annual receipts - 250,000) x 8%, divided by 12', () => {
    // 100,000 x 12 = 1,200,000; (1,200,000 - 250,000) x 8% = 76,000; /12 = 6,333.33
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 100_000 })
    expect(r.taxYearly).toBe(76_000)
    expect(r.taxMonthly).toBe(6_333.33)
    expect(r.takeHomeMonthly).toBe(93_666.67)
  })

  it('graduated: 40% off, then the table, divided by 12', () => {
    // 1,200,000 x 60% = 720,000, which is in the 20% bracket: 22,500 + 20% x 320,000 = 86,500
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'graduated', monthlyIncome: 100_000 })
    expect(r.taxYearly).toBe(86_500)
    expect(r.taxMonthly).toBe(7_208.33)
  })

  it('contributions are off unless chosen, and have no 13th month', () => {
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 30_000 })
    expect([r.sss, r.philhealth, r.pagibig, r.contributions]).toEqual([0, 0, 0, 0])
    expect(r.thirteenthMonth).toBe(0)
  })

  it('takes the chosen contributions off the take-home but not off the tax', () => {
    const without = selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 30_000 })
    const withAll = selfEmployedMonthlyPay({
      year: 2026,
      method: 'eight-percent',
      monthlyIncome: 30_000,
      paysSss: true,
      paysPhilhealth: true,
      monthlyPagibig: 200,
    })
    // 4,500 + 1,500 + 200
    expect(withAll.contributions).toBe(6_200)
    expect(withAll.taxMonthly).toBe(without.taxMonthly)
    expect(withAll.takeHomeMonthly).toBe(without.takeHomeMonthly - 6_200)
  })

  it('charges nothing for no income, even with contributions chosen', () => {
    const r = selfEmployedMonthlyPay({
      year: 2026,
      method: 'graduated',
      monthlyIncome: 0,
      paysSss: true,
      paysPhilhealth: true,
    })
    expect(r.contributions).toBe(0)
    expect(r.taxMonthly).toBe(0)
    expect(r.takeHomeMonthly).toBe(0)
  })

  it('8% is not available over 3,000,000 a year', () => {
    expect(() => selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 260_000 })).toThrow(
      EightPercentNotAvailableError,
    )
    expect(
      selfEmployedMonthlyPay({ year: 2026, method: 'graduated', monthlyIncome: 260_000 }).taxYearly,
    ).toBeGreaterThan(0)
  })

  it('rejects negative amounts', () => {
    expect(() => selfEmployedMonthlyPay({ year: 2026, method: 'graduated', monthlyIncome: -1 })).toThrow(RangeError)
    expect(() =>
      selfEmployedMonthlyPay({ year: 2026, method: 'graduated', monthlyIncome: 1, monthlyPagibig: -5 }),
    ).toThrow(RangeError)
  })
})

describe('selfEmployedMonthlyPay: figures for the tiles and the bracket bar', () => {
  it('graduated: the taxable income is what is left after the 40% deduction', () => {
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'graduated', monthlyIncome: 100_000 })
    expect(r.annualGross).toBe(1_200_000)
    expect(r.taxableIncomeYearly).toBe(720_000)
    expect(r.taxOnBonuses).toBe(0)
  })

  it('8%: the taxable base is the receipts above 250,000', () => {
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 100_000 })
    expect(r.annualGross).toBe(1_200_000)
    expect(r.taxableIncomeYearly).toBe(950_000)
    expect(r.taxYearly).toBe(76_000) // 8% of 950,000
  })
})
