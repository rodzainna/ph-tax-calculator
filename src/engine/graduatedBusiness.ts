import { UnsupportedYearError } from './graduatedTax.ts'
import { roundToPeso } from './money.ts'
import { OSD_RULES, type OsdRule } from './rules/osd.ts'

export function osdRulesFor(year: number): OsdRule {
  const rule = OSD_RULES.find((r) => year >= r.fromYear && (r.toYear === null || year <= r.toYear))
  if (!rule) throw new UnsupportedYearError(year)
  return rule
}

export type BusinessDeduction = 'osd' | 'itemized'

export interface GraduatedBusinessInput {
  /** Gross receipts for the year, before any tax withheld by clients. Services: no cost of sales. */
  grossReceipts: number
  /** Other non-operating income of the business. The OSD does not apply to it. */
  otherNonOperatingIncome?: number
  /** The 40% optional standard deduction (default) or the actual expenses. Never both. */
  deduction?: BusinessDeduction
  /** Business expenses for the year, used only when `deduction` is 'itemized'. */
  itemizedExpenses?: number
}

export interface GraduatedBusinessResult {
  year: number
  grossReceipts: number
  deductionKind: BusinessDeduction
  /** The deduction actually used: 40% of gross receipts, or the itemized expenses. */
  deduction: number
  /** What the 40% standard deduction would be, so the two can be compared. */
  osdDeduction: number
  otherNonOperatingIncome: number
  /** Gross receipts - deduction + other non-operating income, as a whole peso. Negative for a loss, which the BIR form takes off the other taxable income. */
  netBusinessIncome: number
  /** True when the business made a loss: the net is below zero. */
  isLoss: boolean
}

/**
 * Net business income for the graduated rates, with the 40% standard deduction or itemized expenses. It returns the
 * income rather than the tax, because mixed earners add it to their pay first.
 */
export function graduatedBusinessIncome(input: GraduatedBusinessInput, year: number): GraduatedBusinessResult {
  const other = input.otherNonOperatingIncome ?? 0
  const kind = input.deduction ?? 'osd'
  const expenses = input.itemizedExpenses ?? 0
  for (const [name, value] of [
    ['grossReceipts', input.grossReceipts],
    ['otherNonOperatingIncome', other],
    ['itemizedExpenses', expenses],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
    }
  }
  const rule = osdRulesFor(year)
  // Like the form, every line is a whole peso.
  const osdDeduction = roundToPeso(input.grossReceipts * rule.rate)
  const deduction = kind === 'osd' ? osdDeduction : roundToPeso(expenses)
  const net = roundToPeso(input.grossReceipts - deduction + other)
  return {
    year,
    grossReceipts: input.grossReceipts,
    deductionKind: kind,
    deduction,
    osdDeduction,
    otherNonOperatingIncome: other,
    netBusinessIncome: net,
    isLoss: net < 0,
  }
}
