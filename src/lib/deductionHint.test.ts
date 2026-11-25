import { describe, expect, it } from 'vitest'
import { graduatedBusinessIncome, type BusinessDeduction } from '../engine/graduatedBusiness.ts'
import { deductionHint } from './deductionHint.ts'

/** A year's business figures. 40% of the default receipts is 240,000. */
const figures = (itemizedExpenses: number, deduction: BusinessDeduction = 'itemized', grossReceipts = 600_000) =>
  graduatedBusinessIncome({ grossReceipts, deduction, itemizedExpenses }, 2026)

describe('deductionHint', () => {
  it.each([
    [120_000, '₱120,000.00', 'the standard deduction deducts more'],
    [360_000, '₱360,000.00', 'itemizing deducts more'],
    [240_000, '₱240,000.00', 'they are the same'],
  ])('compares expenses of %s with the 40%% standard deduction', (expenses, shown, verdict) => {
    expect(deductionHint(figures(expenses))).toBe(
      `Your expenses for the year are ${shown}. The 40% standard deduction would be ₱240,000.00, so ${verdict}.`,
    )
  })

  it('still compares expenses entered before any receipts', () => {
    expect(deductionHint(figures(12_000, 'itemized', 0))).toContain('so itemizing deducts more.')
  })

  it('says nothing while there is nothing to compare', () => {
    expect(deductionHint(figures(0, 'itemized', 0))).toBeUndefined()
  })

  it('says nothing under the standard deduction, or without graduated figures', () => {
    expect(deductionHint(figures(120_000, 'osd'))).toBeUndefined()
    expect(deductionHint(null)).toBeUndefined()
    expect(deductionHint(undefined)).toBeUndefined()
  })
})
