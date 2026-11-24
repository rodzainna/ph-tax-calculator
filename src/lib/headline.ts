import type { AnnualReturnResult } from '../engine/annualReturn.ts'

export interface Headline {
  label: string
  amount: number
  tone: 'owe' | 'ok' | 'neutral'
}

/** What to show as the big number: the balance if any credit is known, else the full tax. */
export function headlineFor(result: AnnualReturnResult): Headline {
  if (result.totalCredits > 0) {
    if (result.balance > 0) return { label: "You'd still owe", amount: result.balance, tone: 'owe' }
    if (result.balance < 0) return { label: "You'd be overpaid by", amount: -result.balance, tone: 'ok' }
    return { label: 'Nothing left to pay', amount: 0, tone: 'ok' }
  }
  return { label: 'Income tax', amount: result.totalTaxDue, tone: 'neutral' }
}
