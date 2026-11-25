import { roundToCentavos } from '../engine/money.ts'
import type { EmployerDetail } from './employerYear.ts'
import { parsePeso } from './peso.ts'

export interface WithheldProjection {
  /** The tax withheld counted for the whole period the estimate covers. */
  amount: number
  /** The months the typed figure covers, up to the as-of date. */
  monthsSoFar: number
}

/**
 * What the tax withheld comes to over the whole period, when that is not the figure typed. The typed figure is the
 * amount withheld so far, and the estimate repeats it every month, so the two differ until the job has ended or the
 * period is over. Null when nothing is typed or the two are the same.
 */
export function withheldProjection(
  typed: string,
  detail: Pick<EmployerDetail, 'taxWithheld' | 'monthsToDate'> | undefined,
): WithheldProjection | null {
  if (!detail) return null
  const soFar = parsePeso(typed)
  // Blank, zero and text that is not a number all mean there is nothing to project.
  if (!(soFar > 0)) return null
  // Compared in centavos: 8.01 - 8 comes out just under 0.01 in floating point.
  if (roundToCentavos(detail.taxWithheld - soFar) === 0) return null
  return { amount: detail.taxWithheld, monthsSoFar: detail.monthsToDate }
}
