import { UnsupportedYearError } from './graduatedTax.ts'
import { roundToPeso } from './money.ts'
import { EIGHT_PERCENT_RULES, type EightPercentRule } from './rules/eightPercent.ts'

export class EightPercentNotAvailableError extends Error {
  readonly base: number
  readonly threshold: number
  constructor(base: number, threshold: number) {
    super(
      `The 8% option is not available: gross receipts and other non-operating income of ${base} exceed ${threshold}`,
    )
    this.name = 'EightPercentNotAvailableError'
    this.base = base
    this.threshold = threshold
  }
}

export function eightPercentRulesFor(year: number): EightPercentRule {
  const rule = EIGHT_PERCENT_RULES.find((r) => year >= r.fromYear && (r.toYear === null || year <= r.toYear))
  if (!rule) throw new UnsupportedYearError(year)
  return rule
}

export interface EightPercentInput {
  /** Gross sales or gross receipts for the year (before any tax withheld by clients). */
  grossReceipts: number
  /** Other non-operating income from the business or profession, if any. */
  otherNonOperatingIncome?: number
  /** True only for a purely self-employed taxpayer, who gets the P250,000 reduction; false for mixed income. */
  purelySelfEmployed: boolean
}

export interface EightPercentResult {
  year: number
  /** Gross receipts plus other non-operating income. */
  base: number
  /** The P250,000 reduction actually applied (0 for mixed income earners). */
  reduction: number
  taxableBase: number
  rate: number
  tax: number
}

/** Tax under the 8% option for one tax year; throws EightPercentNotAvailableError over the P3,000,000 limit (graduated rates apply instead). */
export function eightPercentTax(input: EightPercentInput, year: number): EightPercentResult {
  const other = input.otherNonOperatingIncome ?? 0
  for (const [name, value] of [
    ['grossReceipts', input.grossReceipts],
    ['otherNonOperatingIncome', other],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
    }
  }

  const rule = eightPercentRulesFor(year)
  // Like the form, every line is a whole peso.
  const base = roundToPeso(input.grossReceipts + other)
  if (base > rule.threshold) throw new EightPercentNotAvailableError(base, rule.threshold)

  const reduction = input.purelySelfEmployed ? Math.min(rule.reduction, base) : 0
  const taxableBase = roundToPeso(base - reduction)
  return { year, base, reduction, taxableBase, rate: rule.rate, tax: roundToPeso(taxableBase * rule.rate) }
}
