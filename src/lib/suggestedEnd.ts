/**
 * Where an end date starts when a range stops being open-ended: the date the figures are counted to if it is in the
 * year, otherwise December 31, and never before the start date. The result is always inside the year.
 */
export function suggestedEnd(year: number, asOf: string, startDate: string): string {
  const base = asOf.slice(0, 4) === String(year) ? asOf : `${year}-12-31`
  const startsLater = startDate.slice(0, 4) === String(year) && startDate > base
  return startsLater ? startDate : base
}
