import type { GraduatedBusinessResult } from '../engine/graduatedBusiness.ts'
import { formatPeso } from './peso.ts'

function verdict({ deduction, osdDeduction }: GraduatedBusinessResult): string {
  if (deduction > osdDeduction) return 'itemizing deducts more'
  if (deduction < osdDeduction) return 'the standard deduction deducts more'
  return 'they are the same'
}

/**
 * For someone itemizing: how the year's expenses compare with the 40% standard deduction. There is nothing to say
 * under the standard deduction, or while both are zero.
 */
export function deductionHint(figures: GraduatedBusinessResult | null | undefined): string | undefined {
  if (figures?.deductionKind !== 'itemized') return undefined
  const { deduction, osdDeduction } = figures
  if (deduction === 0 && osdDeduction === 0) return undefined
  return `Your expenses for the year are ${formatPeso(deduction)}. The 40% standard deduction would be ${formatPeso(osdDeduction)}, so ${verdict(figures)}.`
}
