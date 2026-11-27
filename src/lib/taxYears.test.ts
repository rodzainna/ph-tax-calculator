import { describe, expect, it } from 'vitest'
import { EIGHT_PERCENT_RULES } from '../engine/rules/eightPercent.ts'
import { GRADUATED_RULES } from '../engine/rules/graduated.ts'
import { ANNUAL_FIRST_YEAR, capTaxYear, LATEST_TAX_YEAR, taxYearsFrom } from './taxYears.ts'

describe('the first Annual year', () => {
  it.each([
    ['graduated tables', GRADUATED_RULES],
    ['8% option', EIGHT_PERCENT_RULES],
  ])('is the first year of the %s', (_, rules) => {
    expect(ANNUAL_FIRST_YEAR).toBe(Math.min(...rules.map((rule) => rule.fromYear)))
  })
})

describe('capTaxYear', () => {
  it('leaves a year the app has rules for alone', () => {
    expect(capTaxYear(2024)).toBe(2024)
    expect(capTaxYear(LATEST_TAX_YEAR)).toBe(LATEST_TAX_YEAR)
  })

  it('holds a later calendar year at the latest tax year', () => {
    expect(capTaxYear(LATEST_TAX_YEAR + 1)).toBe(LATEST_TAX_YEAR)
    expect(capTaxYear(2099)).toBe(LATEST_TAX_YEAR)
  })
})

describe('taxYearsFrom', () => {
  it('lists the years newest first, down to the first one', () => {
    expect(taxYearsFrom(2021)).toEqual([2026, 2025, 2024, 2023, 2022, 2021])
    expect(taxYearsFrom(2018)).toHaveLength(9)
    expect(taxYearsFrom(2018)[0]).toBe(LATEST_TAX_YEAR)
    expect(taxYearsFrom(2018).at(-1)).toBe(2018)
  })

  it('is just the latest year when asked from it, and empty when asked from a later one', () => {
    expect(taxYearsFrom(LATEST_TAX_YEAR)).toEqual([LATEST_TAX_YEAR])
    expect(taxYearsFrom(LATEST_TAX_YEAR + 1)).toEqual([])
  })
})
