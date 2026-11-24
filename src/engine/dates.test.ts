import { describe, expect, it } from 'vitest'
import { compareDates, daysInMonth, monthsBetween, monthsWorkedInYear, parseIsoDate } from './dates.ts'

const d = parseIsoDate

describe('parseIsoDate', () => {
  it('reads YYYY-MM-DD', () => {
    expect(d('2026-11-20')).toEqual({ year: 2026, month: 11, day: 20 })
  })

  it('rejects bad text and impossible dates', () => {
    expect(() => d('20/11/2026')).toThrow(RangeError)
    expect(() => d('2026-13-01')).toThrow(RangeError)
    expect(() => d('2026-02-30')).toThrow(RangeError)
    expect(() => d('2025-02-29')).toThrow(RangeError)
    expect(d('2024-02-29').day).toBe(29) // a leap year
  })
})

describe('daysInMonth and compareDates', () => {
  it('knows month lengths, leap years included', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 11)).toBe(30)
    expect(daysInMonth(2026, 12)).toBe(31)
  })

  it('orders dates', () => {
    expect(compareDates(d('2026-01-01'), d('2026-01-02'))).toBeLessThan(0)
    expect(compareDates(d('2026-05-10'), d('2026-05-10'))).toBe(0)
    expect(compareDates(d('2027-01-01'), d('2026-12-31'))).toBeGreaterThan(0)
  })
})

describe('monthsBetween (both days included, partial months prorated by days)', () => {
  it('counts whole months', () => {
    expect(monthsBetween(d('2026-01-01'), d('2026-07-31'))).toBe(7)
    expect(monthsBetween(d('2026-01-01'), d('2026-12-31'))).toBe(12)
    expect(monthsBetween(d('2026-03-01'), d('2026-03-31'))).toBe(1)
  })

  it('prorates a part month by days over the days in that month', () => {
    expect(monthsBetween(d('2026-03-16'), d('2026-03-31'))).toBeCloseTo(16 / 31, 10)
    expect(monthsBetween(d('2026-01-01'), d('2026-01-15'))).toBeCloseTo(15 / 31, 10)
    expect(monthsBetween(d('2026-02-01'), d('2026-02-14'))).toBeCloseTo(14 / 28, 10)
    expect(monthsBetween(d('2024-02-01'), d('2024-02-14'))).toBeCloseTo(14 / 29, 10) // leap year
  })

  it('adds a part month at each end', () => {
    // 16-31 Jan (16/31) + all of Feb (1) + 1-10 Mar (10/31)
    expect(monthsBetween(d('2026-01-16'), d('2026-03-10'))).toBeCloseTo(16 / 31 + 1 + 10 / 31, 10)
  })

  it('counts one day as a thirtieth-ish of a month, and a single day on the last day of a month', () => {
    expect(monthsBetween(d('2026-04-30'), d('2026-04-30'))).toBeCloseTo(1 / 30, 10)
  })

  it('is zero when the end is before the start', () => {
    expect(monthsBetween(d('2026-05-01'), d('2026-04-30'))).toBe(0)
  })

  it('crosses a year end', () => {
    expect(monthsBetween(d('2025-11-01'), d('2026-02-28'))).toBe(4)
  })
})

describe('monthsWorkedInYear', () => {
  it('is Jan 1 to the as-of date when the job started before the year', () => {
    expect(monthsWorkedInYear({ year: 2026, endDate: '2026-07-31' })).toBe(7)
  })

  it('defaults to the full year', () => {
    expect(monthsWorkedInYear({ year: 2026 })).toBe(12)
  })

  it('starts at the job start date when it began mid-year', () => {
    expect(monthsWorkedInYear({ year: 2026, startDate: '2026-09-01', endDate: '2026-11-20' })).toBeCloseTo(
      2 + 20 / 30,
      10,
    )
  })

  it('ignores dates outside the tax year', () => {
    expect(monthsWorkedInYear({ year: 2026, startDate: '2020-05-05', endDate: '2027-03-01' })).toBe(12)
    expect(monthsWorkedInYear({ year: 2026, startDate: '2027-01-05' })).toBe(0)
    expect(monthsWorkedInYear({ year: 2026, endDate: '2025-12-31' })).toBe(0)
  })
})
