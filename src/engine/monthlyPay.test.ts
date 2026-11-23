import { describe, expect, it } from 'vitest'
import { UnsupportedYearError } from './graduatedTax.ts'
import { monthlyPay } from './monthlyPay.ts'

/** Made-up salaries. Expected values worked out by hand from the schedules and the tax table. */
describe('monthlyPay', () => {
  it('30,000 a month (2025): contributions 2,450, tax 1,007.50, take-home 26,542.50', () => {
    const r = monthlyPay({ year: 2025, monthlyBasic: 30_000 })
    expect(r.sss).toBe(1_500)
    expect(r.philhealth).toBe(750)
    expect(r.pagibig).toBe(200)
    expect(r.contributions).toBe(2_450)
    // 12 x 30,000 - 29,400 = 330,600 taxable (the 30,000 13th month is exempt); 15% x 80,600 = 12,090
    expect(r.taxYearly).toBe(12_090)
    expect(r.taxMonthly).toBe(1_007.5)
    expect(r.takeHomeMonthly).toBe(26_542.5)
    expect(r.thirteenthMonth).toBe(30_000)
    expect(r.thirteenthMonthPerMonth).toBe(2_500)
  })

  it('143,000 a month (2026): the 13th month passes 90,000, so part of it is taxed', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 143_000 })
    expect(r.contributions).toBe(4_450) // 1,750 + 2,500 + 200
    // 1,716,000 - 53,400 + (143,000 - 90,000) = 1,715,600; 102,500 + 25% x 915,600 = 331,400
    expect(r.taxYearly).toBe(331_400)
    expect(r.taxMonthly).toBe(27_616.67)
    expect(r.takeHomeMonthly).toBe(110_933.33)
  })

  it('without a 13th month the tax is lower when the pay is high', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 143_000, receivesThirteenthMonth: false })
    // 1,716,000 - 53,400 = 1,662,600; 102,500 + 25% x 862,600 = 318,150
    expect(r.taxYearly).toBe(318_150)
    expect(r.taxMonthly).toBe(26_512.5)
    expect(r.thirteenthMonth).toBe(0)
  })

  it('owes no tax when the year stays under the 250,000 zero bracket', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 15_000 })
    expect(r.contributions).toBe(1_325) // 750 + 375 + 200
    expect(r.taxMonthly).toBe(0)
    expect(r.takeHomeMonthly).toBe(13_675)
  })

  it('taxes an allowance and adds de minimis tax-free to the take-home', () => {
    const r = monthlyPay({ year: 2025, monthlyBasic: 30_000, monthlyTaxableAllowance: 5_000, monthlyDeMinimis: 2_000 })
    // regular 420,000 - 29,400 contributions (on basic only) = 390,600; 15% x 140,600 = 21,090
    expect(r.taxYearly).toBe(21_090)
    expect(r.taxMonthly).toBe(1_757.5)
    expect(r.grossMonthly).toBe(37_000)
    expect(r.takeHomeMonthly).toBe(37_000 - 2_450 - 1_757.5)
  })

  it('uses the rules of the year, including the old Pag-IBIG cap', () => {
    // December 2023: Pag-IBIG cap 5,000 (max 100); SSS 4.5% of MSC 30,000 = 1,350; PhilHealth 4% / 2 on 30,000 = 600
    const r = monthlyPay({ year: 2023, monthlyBasic: 30_000 })
    expect(r.pagibig).toBe(100)
    expect(r.sss).toBe(1_350)
    expect(r.philhealth).toBe(600)
  })

  it('has no estimate before 2021 and rejects negative amounts', () => {
    expect(() => monthlyPay({ year: 2020, monthlyBasic: 30_000 })).toThrow(UnsupportedYearError)
    expect(() => monthlyPay({ year: 2025, monthlyBasic: -1 })).toThrow(RangeError)
    expect(() => monthlyPay({ year: 2025, monthlyBasic: 1, monthlyDeMinimis: -1 })).toThrow(RangeError)
  })

  it('is all zeros for no salary', () => {
    const r = monthlyPay({ year: 2025, monthlyBasic: 0 })
    expect(r.takeHomeMonthly).toBe(0)
    expect(r.contributions).toBe(0) // the minimum SSS and PhilHealth are not charged on no pay
    expect(r.taxMonthly).toBe(0)
  })
})

describe('monthlyPay: the figures behind the stat tiles and the bracket bar', () => {
  // These match an independent calculator for the same inputs:
  // 35,000 a month with a 35,000 13th month -> taxable 386,100, tax 20,415, effective rate 4.5%.
  it('35,000 a month (2026): taxable income 386,100, tax 20,415, effective rate about 4.5%', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 35_000 })
    // SSS 1,750 + PhilHealth 875 + Pag-IBIG 200 = 2,825 a month, 33,900 a year
    expect(r.contributions).toBe(2_825)
    expect(r.annualGross).toBe(455_000) // 12 x 35,000 + the 35,000 13th month
    // 420,000 - 33,900 = 386,100 (the 13th month is under the 90,000 exempt amount)
    expect(r.taxableIncomeYearly).toBe(386_100)
    // 15% x (386,100 - 250,000)
    expect(r.taxYearly).toBe(20_415)
    expect(r.taxYearly / r.annualGross).toBeCloseTo(0.0449, 3)
    expect(r.taxOnBonuses).toBe(0)
  })

  it('150,000 a month (2026): the part of the 13th month above 90,000 is taxed at 25%', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 150_000 })
    // 1,800,000 - 53,400 + (150,000 - 90,000) = 1,806,600
    expect(r.taxableIncomeYearly).toBe(1_806_600)
    // 102,500 + 25% x 1,006,600 = 354,150; without the 13th month 102,500 + 25% x 946,600 = 339,150
    expect(r.taxYearly).toBe(354_150)
    expect(r.taxOnBonuses).toBe(15_000) // 25% of the taxable 60,000
  })

  it('without a 13th month there is no tax on bonuses and the gross is just the salary', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 150_000, receivesThirteenthMonth: false })
    expect(r.taxOnBonuses).toBe(0)
    expect(r.annualGross).toBe(1_800_000)
  })

  it('counts a taxable allowance in the gross and the taxable income', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 35_000, monthlyTaxableAllowance: 5_000 })
    expect(r.annualGross).toBe(35_000 * 12 + 5_000 * 12 + 35_000)
    expect(r.taxableIncomeYearly).toBe(446_100) // 386,100 + 12 x 5,000
  })
})

describe('monthlyPay: yearly 13th month and bonuses, and the minimum wage earner', () => {
  it('a bonus of 150,000 on 35,000 a month: 60,000 of it is taxed, at 20% because it pushes past 400,000', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 35_000, yearlyBonuses: 150_000 })
    expect(r.thirteenthMonth).toBe(150_000)
    expect(r.thirteenthMonthPerMonth).toBe(12_500)
    expect(r.annualGross).toBe(570_000) // 420,000 + 150,000
    // 420,000 - 33,900 + (150,000 - 90,000) = 446,100
    expect(r.taxableIncomeYearly).toBe(446_100)
    // 22,500 + 20% x (446,100 - 400,000) = 31,720
    expect(r.taxYearly).toBe(31_720)
    // 31,720 - 20,415 (the tax with no taxable bonus, worked out above) = 11,305
    expect(r.taxOnBonuses).toBe(11_305)
  })

  it('yearlyBonuses of 0 means no 13th month, the same as turning it off', () => {
    const none = monthlyPay({ year: 2026, monthlyBasic: 35_000, yearlyBonuses: 0 })
    const off = monthlyPay({ year: 2026, monthlyBasic: 35_000, receivesThirteenthMonth: false })
    expect(none.thirteenthMonth).toBe(0)
    expect(none.taxYearly).toBe(off.taxYearly)
    expect(none.annualGross).toBe(420_000)
  })

  it('without yearlyBonuses the default is still one month of basic', () => {
    expect(monthlyPay({ year: 2026, monthlyBasic: 35_000 }).thirteenthMonth).toBe(35_000)
  })

  it('a bonus under 90,000 is not taxed at all', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 35_000, yearlyBonuses: 80_000 })
    expect(r.taxableIncomeYearly).toBe(386_100)
    expect(r.taxOnBonuses).toBe(0)
  })

  it('a minimum wage earner pays no income tax but still pays contributions', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 18_000, isMinimumWageEarner: true })
    expect(r.taxYearly).toBe(0)
    expect(r.taxMonthly).toBe(0)
    expect(r.taxableIncomeYearly).toBe(0)
    expect(r.taxOnBonuses).toBe(0)
    expect(r.contributions).toBeGreaterThan(0)
    expect(r.takeHomeMonthly).toBe(18_000 - r.contributions)
  })

  it('rejects a negative bonus', () => {
    expect(() => monthlyPay({ year: 2026, monthlyBasic: 35_000, yearlyBonuses: -1 })).toThrow(RangeError)
  })
})
