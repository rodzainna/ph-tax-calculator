import { describe, expect, it } from 'vitest'
import { suggestedEnd } from './suggestedEnd.ts'

describe('suggestedEnd', () => {
  it('is the counted-to date when it is in the year', () => {
    expect(suggestedEnd(2026, '2026-06-15', '')).toBe('2026-06-15')
  })

  it('is December 31 when the counted-to date is in another year', () => {
    expect(suggestedEnd(2025, '2026-06-15', '')).toBe('2025-12-31')
    expect(suggestedEnd(2027, '2026-06-15', '')).toBe('2027-12-31')
  })

  it('is never before the start date', () => {
    expect(suggestedEnd(2026, '2026-06-15', '2026-09-01')).toBe('2026-09-01')
  })

  it('keeps the counted-to date when the start date is earlier or the same day', () => {
    expect(suggestedEnd(2026, '2026-06-15', '2026-03-01')).toBe('2026-06-15')
    expect(suggestedEnd(2026, '2026-06-15', '2026-06-15')).toBe('2026-06-15')
  })

  it('stays inside the year even when the start date is in a later one', () => {
    expect(suggestedEnd(2026, '2026-06-15', '2027-02-01')).toBe('2026-06-15')
    expect(suggestedEnd(2025, '2026-06-15', '2026-02-01')).toBe('2025-12-31')
  })

  it('does not let a start date in another year pull the end into that year', () => {
    expect(suggestedEnd(2026, '2026-06-15', '2025-03-01')).toBe('2026-06-15')
  })
})
