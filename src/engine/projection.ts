import { roundToCentavos } from './money.ts'

/** Scales a year-to-date figure to a longer period at the same pace: ytd x (projectedMonths / monthsElapsed). */
export function extrapolate(yearToDate: number, monthsElapsed: number, projectedMonths: number): number {
  if (!Number.isFinite(yearToDate) || yearToDate < 0) throw new RangeError(`yearToDate must be 0 or more, got ${yearToDate}`)
  if (!Number.isFinite(monthsElapsed) || monthsElapsed < 0 || monthsElapsed > 12) {
    throw new RangeError(`monthsElapsed must be 0 to 12, got ${monthsElapsed}`)
  }
  if (!Number.isFinite(projectedMonths) || projectedMonths < 0 || projectedMonths > 12) {
    throw new RangeError(`projectedMonths must be 0 to 12, got ${projectedMonths}`)
  }
  if (monthsElapsed === 0) {
    if (yearToDate === 0) return 0
    throw new RangeError('Cannot project a year-to-date amount over zero elapsed months')
  }
  return roundToCentavos((yearToDate * projectedMonths) / monthsElapsed)
}
