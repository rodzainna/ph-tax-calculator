import type { EightPercentNotAvailableError } from '../engine/eightPercentTax.ts'
import { formatPeso } from './peso.ts'

/** Shown when a calculation fails for a reason the person could not have caused with what they typed. */
export const UNEXPECTED_PROBLEM = 'Those figures could not be worked out. Check the amounts and the tax year.'

/** Why there is no estimate under the 8% option when the year's business income is over its limit. */
export const eightPercentOverLimit = ({ threshold, base }: EightPercentNotAvailableError) =>
  `The 8% option only covers up to ${formatPeso(threshold)} a year. Your business income for the year is ${formatPeso(base)}, so the 8% option is not available. Choose Graduated rates instead.`
