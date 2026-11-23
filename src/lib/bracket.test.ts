import { describe, expect, it } from 'vitest'
import { bracketPosition, bracketSegments, shortPeso } from './bracket.ts'

describe('bracketSegments', () => {
  it('2026 has six segments: 0, 15, 20, 25, 30 and 35%', () => {
    const s = bracketSegments(2026)
    expect(s.map((x) => x.rate)).toEqual([0, 0.15, 0.2, 0.25, 0.3, 0.35])
    expect(s[0]).toEqual({ rate: 0, from: 0, to: 250_000 })
    expect(s[1]).toEqual({ rate: 0.15, from: 250_000, to: 400_000 })
    expect(s[5]).toEqual({ rate: 0.35, from: 8_000_000, to: null })
  })

  it('follows the year: 2022 had the old table, 20 / 25 / 30 / 32 / 35%', () => {
    expect(bracketSegments(2022).map((x) => x.rate)).toEqual([0, 0.2, 0.25, 0.3, 0.32, 0.35])
  })
})

describe('bracketPosition', () => {
  it('386,100 (2026) is in the 15% segment, most of the way through it', () => {
    const p = bracketPosition(386_100, 2026)
    expect(p.index).toBe(1)
    expect(p.rate).toBe(0.15)
    // (386,100 - 250,000) / 150,000
    expect(p.fraction).toBeCloseTo(0.9073, 3)
  })

  it('zero income sits at the start of the first segment', () => {
    const p = bracketPosition(0, 2026)
    expect([p.index, p.fraction, p.rate]).toEqual([0, 0, 0])
  })

  it('exactly 250,000 is still in the first segment, at its end', () => {
    const p = bracketPosition(250_000, 2026)
    expect([p.index, p.fraction]).toEqual([0, 1])
  })

  it('a peso over a boundary moves into the next segment', () => {
    expect(bracketPosition(250_001, 2026).index).toBe(1)
    expect(bracketPosition(400_000, 2026).index).toBe(1)
    expect(bracketPosition(400_001, 2026).index).toBe(2)
  })

  it('the top segment has no end, so the marker sits part-way', () => {
    const p = bracketPosition(12_000_000, 2026)
    expect([p.index, p.fraction, p.rate]).toEqual([5, 0.5, 0.35])
  })

  it('treats a negative income as zero', () => {
    expect(bracketPosition(-5_000, 2026).index).toBe(0)
  })
})

describe('shortPeso', () => {
  it('shortens thousands and millions', () => {
    expect(shortPeso(250_000)).toBe('250K')
    expect(shortPeso(800_000)).toBe('800K')
    expect(shortPeso(2_000_000)).toBe('2M')
    expect(shortPeso(8_000_000)).toBe('8M')
  })
})
