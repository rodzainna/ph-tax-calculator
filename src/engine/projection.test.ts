import { describe, expect, it } from 'vitest'
import { extrapolate } from './projection.ts'

describe('extrapolate a year-to-date figure at the same pace', () => {
  it('scales by projected months over months elapsed', () => {
    expect(extrapolate(300_000, 6, 12)).toBe(600_000)
    expect(extrapolate(500_000, 10, 12)).toBe(600_000)
    expect(extrapolate(70_000, 7, 12)).toBe(120_000)
  })

  it('gives the same figure when the period is not extended', () => {
    expect(extrapolate(123_456.78, 5, 5)).toBe(123_456.78)
  })

  it('can project a shorter period (someone leaving earlier)', () => {
    expect(extrapolate(300_000, 6, 3)).toBe(150_000)
  })

  it('rounds to the centavo', () => {
    expect(extrapolate(100_000, 7, 12)).toBe(171_428.57)
  })

  it('handles an empty year to date', () => {
    expect(extrapolate(0, 0, 12)).toBe(0)
    expect(() => extrapolate(1_000, 0, 12)).toThrow(RangeError)
  })

  it('rejects impossible inputs', () => {
    expect(() => extrapolate(-1, 6, 12)).toThrow(RangeError)
    expect(() => extrapolate(1, 13, 12)).toThrow(RangeError)
    expect(() => extrapolate(1, 6, 13)).toThrow(RangeError)
    expect(() => extrapolate(Number.NaN, 6, 12)).toThrow(RangeError)
  })
})
