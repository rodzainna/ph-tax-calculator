import { describe, expect, it } from 'vitest'
import { EightPercentNotAvailableError, eightPercentTax } from './eightPercentTax.ts'
import { UnsupportedYearError } from './graduatedTax.ts'

/** Made-up amounts; expected values worked out by hand from NIRC Sec. 24(A)(2)(b),(c). */
describe('eightPercentTax, purely self-employed (P250,000 reduction)', () => {
  const cases: Array<[gross: number, expected: number, why: string]> = [
    [0, 0, 'no receipts'],
    [200_000, 0, 'under the reduction'],
    [250_000, 0, 'exactly the reduction'],
    [500_000, 20_000, '8% x (500,000 - 250,000)'],
    [600_000, 28_000, '8% x 350,000'],
    [3_000_000, 220_000, '8% x 2,750,000, exactly at the limit'],
  ]
  it.each(cases)('gross %d -> tax %d (%s)', (gross, expected) => {
    expect(eightPercentTax({ grossReceipts: gross, purelySelfEmployed: true }, 2024).tax).toBe(expected)
  })

  it('reports how the tax was built', () => {
    expect(eightPercentTax({ grossReceipts: 500_000, purelySelfEmployed: true }, 2024)).toEqual({
      year: 2024,
      base: 500_000,
      reduction: 250_000,
      taxableBase: 250_000,
      rate: 0.08,
      tax: 20_000,
    })
  })

  it('adds other non-operating income to the base', () => {
    const result = eightPercentTax(
      { grossReceipts: 400_000, otherNonOperatingIncome: 100_000, purelySelfEmployed: true },
      2024,
    )
    expect(result.base).toBe(500_000)
    expect(result.tax).toBe(20_000)
  })
})

describe('eightPercentTax, mixed income earner (no reduction)', () => {
  it('taxes the whole base', () => {
    const result = eightPercentTax({ grossReceipts: 500_000, purelySelfEmployed: false }, 2024)
    expect(result.reduction).toBe(0)
    expect(result.tax).toBe(40_000) // 8% x 500,000
  })

  it('taxes even small receipts, unlike the purely self-employed case', () => {
    expect(eightPercentTax({ grossReceipts: 200_000, purelySelfEmployed: false }, 2024).tax).toBe(16_000)
  })
})

describe('limits and years', () => {
  it('allows exactly 3,000,000 and refuses a whole peso more', () => {
    expect(() => eightPercentTax({ grossReceipts: 3_000_000, purelySelfEmployed: true }, 2024)).not.toThrow()
    expect(() => eightPercentTax({ grossReceipts: 3_000_001, purelySelfEmployed: true }, 2024)).toThrow(
      EightPercentNotAvailableError,
    )
  })

  it('counts the limit on the whole-peso total, like the form: 3,000,000.49 is allowed, 3,000,000.50 is not', () => {
    expect(() => eightPercentTax({ grossReceipts: 3_000_000.49, purelySelfEmployed: true }, 2024)).not.toThrow()
    expect(() => eightPercentTax({ grossReceipts: 3_000_000.5, purelySelfEmployed: true }, 2024)).toThrow(
      EightPercentNotAvailableError,
    )
  })

  it('counts other non-operating income toward the limit', () => {
    expect(() =>
      eightPercentTax({ grossReceipts: 2_900_000, otherNonOperatingIncome: 150_000, purelySelfEmployed: false }, 2024),
    ).toThrow(EightPercentNotAvailableError)
  })

  it('exists from 2018 and refuses earlier years', () => {
    expect(eightPercentTax({ grossReceipts: 500_000, purelySelfEmployed: true }, 2018).tax).toBe(20_000)
    expect(() => eightPercentTax({ grossReceipts: 500_000, purelySelfEmployed: true }, 2017)).toThrow(
      UnsupportedYearError,
    )
  })

  it('rejects negative amounts', () => {
    expect(() => eightPercentTax({ grossReceipts: -1, purelySelfEmployed: true }, 2024)).toThrow(RangeError)
    expect(() =>
      eightPercentTax({ grossReceipts: 1, otherNonOperatingIncome: -1, purelySelfEmployed: true }, 2024),
    ).toThrow(RangeError)
  })
})
