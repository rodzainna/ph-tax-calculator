import { describe, expect, it } from 'vitest'
import { employeeRates, estimateContributions, monthlyContributions } from './contributions.ts'
import { UnsupportedYearError } from './graduatedTax.ts'

/** Expected values worked out by hand from the SSS, PhilHealth and Pag-IBIG schedules. */
describe('SSS employee share', () => {
  const sss = (year: number, base: number) => monthlyContributions(year, 6, { monthlyBasic: base }).sss

  it('2025 and 2026 (employee 5%, MSC 5,000 to 35,000)', () => {
    expect(sss(2025, 30_000)).toEqual({ msc: 30_000, regular: 1_000, mpf: 500, total: 1_500 })
    expect(sss(2025, 5_000)).toEqual({ msc: 5_000, regular: 250, mpf: 0, total: 250 })
    expect(sss(2026, 143_000)).toEqual({ msc: 35_000, regular: 1_000, mpf: 750, total: 1_750 })
    expect(sss(2025, 20_000).total).toBe(1_000) // top of the regular part, no MPF yet
  })

  it('moves to the next bracket at the edge of the range', () => {
    expect(sss(2025, 5_249.99).msc).toBe(5_000)
    expect(sss(2025, 5_250).msc).toBe(5_500)
    expect(sss(2025, 5_250).total).toBe(275)
    expect(sss(2025, 34_749.99).msc).toBe(34_500)
    expect(sss(2025, 34_750).msc).toBe(35_000)
  })

  it('2023 and 2024 (employee 4.5%, MSC 4,000 to 30,000)', () => {
    for (const year of [2023, 2024]) {
      expect(sss(year, 30_000)).toEqual({ msc: 30_000, regular: 900, mpf: 450, total: 1_350 })
      expect(sss(year, 100_000).msc).toBe(30_000)
      expect(sss(year, 3_000)).toEqual({ msc: 4_000, regular: 180, mpf: 0, total: 180 })
    }
  })

  it('2021 and 2022 (employee 4.5%, MSC 3,000 to 25,000)', () => {
    for (const year of [2021, 2022]) {
      expect(sss(year, 25_000).total).toBe(1_125)
      expect(sss(year, 90_000)).toEqual({ msc: 25_000, regular: 900, mpf: 225, total: 1_125 })
      expect(sss(year, 2_000)).toEqual({ msc: 3_000, regular: 135, mpf: 0, total: 135 })
    }
  })

  it('uses a separate base for SSS when given', () => {
    const m = monthlyContributions(2025, 6, { monthlyBasic: 29_375, monthlySssBase: 31_620.45 })
    expect(m.sss.msc).toBe(31_500) // from the SSS base, not the basic
    expect(m.philhealth).toBe(734.38) // PhilHealth still on basic: 29,375 x 5% / 2
  })
})

describe('PhilHealth employee share (half of the premium, on basic salary)', () => {
  const ph = (year: number, basic: number) => monthlyContributions(year, 6, { monthlyBasic: basic }).philhealth

  it('2024 onwards: 5%, floor 10,000, ceiling 100,000', () => {
    expect(ph(2025, 30_000)).toBe(750)
    expect(ph(2025, 8_000)).toBe(250) // floor: 5% x 10,000 / 2
    expect(ph(2025, 150_000)).toBe(2_500) // ceiling: 5% x 100,000 / 2
    expect(ph(2026, 29_375)).toBe(734.38) // 734.375 rounds up
    expect(ph(2024, 30_000)).toBe(750)
  })

  it('2023: 4% (the 4.5% increase was suspended)', () => {
    expect(ph(2023, 50_000)).toBe(1_000)
  })

  it('2022: 4%, ceiling 80,000', () => {
    expect(ph(2022, 50_000)).toBe(1_000)
    expect(ph(2022, 90_000)).toBe(1_600)
  })

  it('2021: 3.5%, ceiling 70,000', () => {
    expect(ph(2021, 60_000)).toBe(1_050)
    expect(ph(2021, 80_000)).toBe(1_225)
  })
})

describe('Pag-IBIG employee share', () => {
  const pi = (year: number, month: number, basic: number) => monthlyContributions(year, month, { monthlyBasic: basic }).pagibig

  it('is 2% up to a 10,000 cap from February 2024 (max 200)', () => {
    expect(pi(2025, 6, 30_000)).toBe(200)
    expect(pi(2024, 2, 30_000)).toBe(200)
    expect(pi(2025, 6, 5_000)).toBe(100)
  })

  it('was capped at 5,000 (max 100) before February 2024, including January 2024', () => {
    expect(pi(2024, 1, 30_000)).toBe(100)
    expect(pi(2023, 12, 30_000)).toBe(100)
    expect(pi(2021, 3, 30_000)).toBe(100)
  })

  it('is 1% when the fund salary is 1,500 or less', () => {
    expect(pi(2025, 6, 1_500)).toBe(15)
    expect(pi(2025, 6, 1_500.01)).toBe(30.0) // 2% x 1,500.01 = 30.0002
  })
})

describe('estimateContributions over the months worked', () => {
  it('adds a full year at the 2025 rules', () => {
    const e = estimateContributions({ year: 2025, monthlyBasic: 30_000, months: 12 })
    expect(e.sss).toEqual({ regular: 12_000, mpf: 6_000, total: 18_000 })
    expect(e.philhealth).toBe(9_000)
    expect(e.pagibig).toBe(2_400)
    expect(e.total).toBe(29_400)
  })

  it('handles the February 2024 Pag-IBIG change inside one year', () => {
    const e = estimateContributions({ year: 2024, monthlyBasic: 30_000, months: 12 })
    expect(e.pagibig).toBe(2_300) // 100 in January + 11 x 200
    expect(e.sss.total).toBe(16_200) // 12 x 1,350
    expect(e.philhealth).toBe(9_000)
    expect(e.total).toBe(27_500)
  })

  it('counts only the months worked, from a start month', () => {
    const e = estimateContributions({ year: 2025, monthlyBasic: 30_000, months: 7, startMonth: 1 })
    expect(e.total).toBe(7 * 2_450) // 1,500 + 750 + 200 per month
    const late = estimateContributions({ year: 2024, monthlyBasic: 30_000, months: 1, startMonth: 1 })
    expect(late.pagibig).toBe(100) // only January, still the old cap
  })

  it('is zero for zero months', () => {
    expect(estimateContributions({ year: 2025, monthlyBasic: 30_000, months: 0 }).total).toBe(0)
  })
})

describe('limits', () => {
  it('has no automatic estimate before 2021', () => {
    expect(() => monthlyContributions(2020, 6, { monthlyBasic: 30_000 })).toThrow(UnsupportedYearError)
    expect(() => estimateContributions({ year: 2019, monthlyBasic: 30_000, months: 12 })).toThrow(UnsupportedYearError)
  })

  it('rejects impossible months and negative pay', () => {
    expect(() => monthlyContributions(2025, 13, { monthlyBasic: 1 })).toThrow(RangeError)
    expect(() => estimateContributions({ year: 2025, monthlyBasic: 1, months: 13 })).toThrow(RangeError)
    expect(() => estimateContributions({ year: 2025, monthlyBasic: 1, months: 6, startMonth: 8 })).toThrow(RangeError)
    expect(() => monthlyContributions(2025, 1, { monthlyBasic: -1 })).toThrow(RangeError)
  })
})

describe('employeeRates (the rate shown next to each contribution)', () => {
  it('2026: SSS 5%, PhilHealth 2.5% (half of 5%), Pag-IBIG 2%', () => {
    expect(employeeRates(2026, 35_000)).toEqual({ sss: 0.05, philhealth: 0.025, pagibig: 0.02 })
  })

  it('follows the year: 2023 had SSS 4.5% and PhilHealth 2% (half of 4%)', () => {
    const r = employeeRates(2023, 30_000)
    expect(r.sss).toBe(0.045)
    expect(r.philhealth).toBe(0.02)
  })

  it('2021 PhilHealth was 1.75% for the employee (half of 3.5%)', () => {
    expect(employeeRates(2021, 30_000).philhealth).toBe(0.0175)
  })

  it('Pag-IBIG is 1% when the fund salary is 1,500 or less', () => {
    expect(employeeRates(2026, 1_500).pagibig).toBe(0.01)
    expect(employeeRates(2026, 1_501).pagibig).toBe(0.02)
  })

  it('rejects a year with no rules', () => {
    expect(() => employeeRates(2019, 30_000)).toThrow(UnsupportedYearError)
  })
})
