/** The latest tax year the app has rules for. Add a year here when new rules are added. */
export const LATEST_TAX_YEAR = 2026

/** A calendar year, but no later than the latest year the app has rules for. */
export const capTaxYear = (year: number): number => Math.min(year, LATEST_TAX_YEAR)

/** The tax years to offer, newest first, down to `firstYear`. */
export function taxYearsFrom(firstYear: number): number[] {
  return Array.from({ length: Math.max(0, LATEST_TAX_YEAR - firstYear + 1) }, (_, i) => LATEST_TAX_YEAR - i)
}
