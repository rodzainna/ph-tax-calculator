/** Calendar helpers on plain ISO dates so time zones never shift a day; months worked are fractional (days worked over days in the month). */
export interface CalendarDate {
  year: number
  month: number // 1-12
  day: number // 1-31
}

export function parseIsoDate(text: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) throw new RangeError(`"${text}" is not a date in YYYY-MM-DD form`)
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > daysInMonth(date.year, date.month)) {
    throw new RangeError(`"${text}" is not a real calendar date`)
  }
  return date
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Compares two dates: negative if a is before b, 0 if equal, positive if after. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

export const startOfYear = (year: number): CalendarDate => ({ year, month: 1, day: 1 })
export const endOfYear = (year: number): CalendarDate => ({ year, month: 12, day: 31 })

/** Months worked from `start` to `end`, both days included; part of a month is days covered over days in it (16-31 March is 16/31). */
export function monthsBetween(start: CalendarDate, end: CalendarDate): number {
  if (compareDates(end, start) < 0) return 0
  let total = 0
  let year = start.year
  let month = start.month
  while (year < end.year || (year === end.year && month <= end.month)) {
    const length = daysInMonth(year, month)
    const first = year === start.year && month === start.month ? start.day : 1
    const last = year === end.year && month === end.month ? end.day : length
    total += (last - first + 1) / length
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return total
}

export interface WorkedMonthsInput {
  year: number
  /** First day of the job, if it started this year or later. Blank means since before the year. */
  startDate?: string
  /** Last day counted. Defaults to the end of the year. */
  endDate?: string
}

/** Months worked inside the tax year, from Jan 1 (or the start date) to the end date, capped at Dec 31. */
export function monthsWorkedInYear({ year, startDate, endDate }: WorkedMonthsInput): number {
  const yearStart = startOfYear(year)
  const yearEnd = endOfYear(year)
  const start = startDate ? parseIsoDate(startDate) : yearStart
  const end = endDate ? parseIsoDate(endDate) : yearEnd
  const from = compareDates(start, yearStart) < 0 ? yearStart : start
  const to = compareDates(end, yearEnd) > 0 ? yearEnd : end
  return monthsBetween(from, to)
}
