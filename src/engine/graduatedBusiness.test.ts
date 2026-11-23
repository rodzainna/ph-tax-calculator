import { describe, expect, it } from 'vitest'
import { graduatedBusinessIncome } from './graduatedBusiness.ts'
import { UnsupportedYearError } from './graduatedTax.ts'

/** Expected values are worked out by hand: 40% off gross, other income added in full. */
describe('graduatedBusinessIncome (40% optional standard deduction)', () => {
  it('deducts 40% of gross receipts', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 1_000_000 }, 2026)
    expect(r.deduction).toBe(400_000)
    expect(r.netBusinessIncome).toBe(600_000)
  })

  it('adds other non-operating income without the deduction', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 1_000_000, otherNonOperatingIncome: 20_000 }, 2026)
    expect(r.deduction).toBe(400_000)
    expect(r.netBusinessIncome).toBe(620_000)
  })

  it('rounds each line to a whole peso, like the BIR form', () => {
    // 100,000.55 x 40% = 40,000.22 -> 40,000; 100,000.55 - 40,000 = 60,000.55 -> 60,001
    const r = graduatedBusinessIncome({ grossReceipts: 100_000.55 }, 2026)
    expect(r.deduction).toBe(40_000)
    expect(r.netBusinessIncome).toBe(60_001)
  })

  it('is zero for no receipts', () => {
    expect(graduatedBusinessIncome({ grossReceipts: 0 }, 2026).netBusinessIncome).toBe(0)
  })

  it('rejects negative or invalid amounts', () => {
    expect(() => graduatedBusinessIncome({ grossReceipts: -1 }, 2026)).toThrow(RangeError)
    expect(() => graduatedBusinessIncome({ grossReceipts: 1, otherNonOperatingIncome: Number.NaN }, 2026)).toThrow(RangeError)
  })

  it('rejects a year with no rule', () => {
    expect(() => graduatedBusinessIncome({ grossReceipts: 1 }, 2017)).toThrow(UnsupportedYearError)
  })
})

describe('graduatedBusinessIncome (itemized expenses)', () => {
  it('deducts the actual expenses instead of 40%', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 1_000_000, deduction: 'itemized', itemizedExpenses: 250_000 }, 2026)
    expect(r.deductionKind).toBe('itemized')
    expect(r.deduction).toBe(250_000)
    expect(r.netBusinessIncome).toBe(750_000)
  })

  it('still reports what the 40% deduction would have been', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 1_000_000, deduction: 'itemized', itemizedExpenses: 250_000 }, 2026)
    expect(r.osdDeduction).toBe(400_000)
  })

  it('does not use the expenses when the standard deduction is chosen', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 1_000_000, deduction: 'osd', itemizedExpenses: 900_000 }, 2026)
    expect(r.deduction).toBe(400_000)
    expect(r.netBusinessIncome).toBe(600_000)
  })

  it('adds other income after the expenses', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 500_000, otherNonOperatingIncome: 10_000, deduction: 'itemized', itemizedExpenses: 100_000 }, 2026)
    expect(r.netBusinessIncome).toBe(410_000)
  })

  it('keeps a loss as a negative income and says so, as the BIR form does', () => {
    const r = graduatedBusinessIncome({ grossReceipts: 100_000, deduction: 'itemized', itemizedExpenses: 150_000 }, 2026)
    expect(r.netBusinessIncome).toBe(-50_000)
    expect(r.isLoss).toBe(true)
  })

  it('rejects negative expenses', () => {
    expect(() => graduatedBusinessIncome({ grossReceipts: 1, deduction: 'itemized', itemizedExpenses: -1 }, 2026)).toThrow(RangeError)
  })
})
