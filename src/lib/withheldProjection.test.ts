import { describe, expect, it } from 'vitest'
import { withheldProjection } from './withheldProjection.ts'

const detail = (taxWithheld: number, monthsToDate = 6) => ({ taxWithheld, monthsToDate })

describe('withheldProjection', () => {
  it('gives the projected amount and the months it was typed for when they differ', () => {
    expect(withheldProjection('50,000', detail(100_000, 6.5))).toEqual({ amount: 100_000, monthsSoFar: 6.5 })
  })

  it('is null when the projection is the same as what was typed', () => {
    expect(withheldProjection('50,000', detail(50_000))).toBeNull()
  })

  it('treats a difference under a centavo as the same', () => {
    expect(withheldProjection('50,000', detail(50_000.004))).toBeNull()
    expect(withheldProjection('50,000', detail(50_000.01))).not.toBeNull()
    expect(withheldProjection('8', detail(8.01))).not.toBeNull()
  })

  it('is null when nothing is typed, or it is zero', () => {
    expect(withheldProjection('', detail(100_000))).toBeNull()
    expect(withheldProjection('0', detail(100_000))).toBeNull()
  })

  it('is null when what was typed is not a number', () => {
    expect(withheldProjection('abc', detail(100_000))).toBeNull()
  })

  it('is null without the employer figures', () => {
    expect(withheldProjection('50,000', undefined)).toBeNull()
  })
})
