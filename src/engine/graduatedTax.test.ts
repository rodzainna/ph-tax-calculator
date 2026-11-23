import { describe, expect, it } from 'vitest'
import { graduatedRulesFor, graduatedTax, UnsupportedYearError } from './graduatedTax.ts'

/**
 * Expected values are worked out by hand from the statute (RA 10963), not copied from the code.
 * All incomes are made-up examples.
 */
describe('graduatedTax, 2023 onwards (15% / 20% / 25% / 30% / 35%)', () => {
  const cases: Array<[income: number, expected: number, why: string]> = [
    [0, 0, 'no income'],
    [250_000, 0, 'top of the zero bracket'],
    [300_000, 7_500, '15% of 50,000'],
    [400_000, 22_500, '15% of 150,000, top of the 15% bracket'],
    [500_000, 42_500, '22,500 + 20% of 100,000'],
    [600_000, 62_500, '22,500 + 20% of 200,000'],
    [800_000, 102_500, '22,500 + 20% of 400,000, top of the 20% bracket'],
    [1_000_000, 152_500, '102,500 + 25% of 200,000'],
    [2_000_000, 402_500, '102,500 + 25% of 1,200,000, top of the 25% bracket'],
    [3_000_000, 702_500, '402,500 + 30% of 1,000,000'],
    [8_000_000, 2_202_500, '402,500 + 30% of 6,000,000, top of the 30% bracket'],
    [10_000_000, 2_902_500, '2,202,500 + 35% of 2,000,000'],
  ]
  it.each(cases)('income %d -> tax %d (%s)', (income, expected) => {
    expect(graduatedTax(income, 2023)).toBe(expected)
    expect(graduatedTax(income, 2026)).toBe(expected)
  })

  it('rounds to the centavo', () => {
    // 300,000.33: excess 50,000.33 x 15% = 7,500.0495
    expect(graduatedTax(300_000.33, 2024)).toBe(7_500.05)
    // 1,234,567.89: 102,500 + 25% x 434,567.89 = 211,141.9725
    expect(graduatedTax(1_234_567.89, 2024)).toBe(211_141.97)
  })

  it('charges no tax on a loss or on income a centavo above the threshold', () => {
    expect(graduatedTax(-5_000, 2024)).toBe(0)
    expect(graduatedTax(250_000.01, 2024)).toBe(0) // 15% of 0.01 rounds to 0.00
  })
})

describe('graduatedTax, 2018 to 2022 (20% / 25% / 30% / 32% / 35%)', () => {
  const cases: Array<[income: number, expected: number, why: string]> = [
    [250_000, 0, 'top of the zero bracket'],
    [300_000, 10_000, '20% of 50,000'],
    [400_000, 30_000, '20% of 150,000, top of the 20% bracket'],
    [500_000, 55_000, '30,000 + 25% of 100,000'],
    [800_000, 130_000, '30,000 + 25% of 400,000, top of the 25% bracket'],
    [1_000_000, 190_000, '130,000 + 30% of 200,000'],
    [2_000_000, 490_000, '130,000 + 30% of 1,200,000, top of the 30% bracket'],
    [3_000_000, 810_000, '490,000 + 32% of 1,000,000'],
    [8_000_000, 2_410_000, '490,000 + 32% of 6,000,000, top of the 32% bracket'],
    [9_000_000, 2_760_000, '2,410,000 + 35% of 1,000,000'],
  ]
  it.each(cases)('income %d -> tax %d (%s)', (income, expected) => {
    for (const year of [2018, 2021, 2022]) {
      expect(graduatedTax(income, year)).toBe(expected)
    }
  })
})

describe('tax year handling', () => {
  it('switches tables between 2022 and 2023', () => {
    expect(graduatedTax(500_000, 2022)).toBe(55_000)
    expect(graduatedTax(500_000, 2023)).toBe(42_500)
  })

  it('picks the right table for each year', () => {
    expect(graduatedRulesFor(2018).toYear).toBe(2022)
    expect(graduatedRulesFor(2022).fromYear).toBe(2018)
    expect(graduatedRulesFor(2023).toYear).toBeNull()
    expect(graduatedRulesFor(2040).fromYear).toBe(2023)
  })

  it('refuses years before 2018, where the pre-TRAIN rules differ', () => {
    expect(() => graduatedTax(500_000, 2017)).toThrow(UnsupportedYearError)
    expect(() => graduatedTax(500_000, 2010)).toThrow(UnsupportedYearError)
  })

  it('rejects income that is not a number', () => {
    expect(() => graduatedTax(Number.NaN, 2024)).toThrow(TypeError)
    expect(() => graduatedTax(Number.POSITIVE_INFINITY, 2024)).toThrow(TypeError)
  })
})
