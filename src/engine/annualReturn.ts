import { compensationTax, type CompensationTaxResult, type EmployerCompensation } from './compensationTax.ts'
import { eightPercentTax, type EightPercentResult } from './eightPercentTax.ts'
import { graduatedBusinessIncome, type GraduatedBusinessResult } from './graduatedBusiness.ts'
import { graduatedTaxToPeso } from './graduatedTax.ts'
import { roundToCentavos, roundToPeso } from './money.ts'

export interface BusinessIncome {
  grossReceipts: number
  otherNonOperatingIncome?: number
  /** Quarterly income tax already paid on the 1701Q returns for the year. */
  quarterlyTaxPaid?: number
  /** Tax withheld by clients that is supported by a BIR Form 2307 in hand. Counted as a credit. */
  creditableWithholding?: number
  /** Tax a client says it withheld but has not certified with a 2307; not in the balance, shown as a possible further reduction. */
  pendingCreditableWithholding?: number
  /** Graduated rates only: the 40% standard deduction (default) or itemized expenses. */
  deduction?: 'osd' | 'itemized'
  /** Graduated rates only: business expenses for the year, used when `deduction` is 'itemized'. */
  itemizedExpenses?: number
}

export interface AnnualReturnInput {
  year: number
  /** Employers' figures (BIR Form 2316 per employer). Leave empty if there is no compensation. */
  employers?: EmployerCompensation[]
  /** Business or professional income under the 8% option. Leave out if there is none. */
  business?: BusinessIncome
}

export interface AnnualReturnResult {
  year: number
  /** Which return this resembles: 1700 (compensation only), 1701A (business only) or 1701 (both). */
  form: '1700' | '1701A' | '1701'
  compensation: CompensationTaxResult | null
  /** Business income under the 8% option. Null if none, or if the graduated rates are used. */
  business: (EightPercentResult & { quarterlyTaxPaid: number; creditableWithholding: number }) | null
  /** Business income under the graduated rates (40% optional standard deduction). Null otherwise. */
  graduatedBusiness: (GraduatedBusinessResult & { quarterlyTaxPaid: number; creditableWithholding: number }) | null
  /** Graduated rates only: taxable pay + net business income, the amount the table is applied to. */
  combinedTaxableIncome: number | null
  totalTaxDue: number
  /** Withholding on compensation + 1701Q payments + 2307 credits in hand. */
  totalCredits: number
  /** totalTaxDue - totalCredits. Positive: payable. Negative: overpaid. */
  balance: number
  /** Credit that is claimed by a client but not yet certified (no 2307). */
  pendingCredit: number
  /** What the balance would be if the pending credit were allowed. */
  balanceIfPendingCreditAllowed: number
}

function nonNegative(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
  }
  return value
}

/** Annual tax with the 8% option: compensation only is the 1700, business only the 1701A, both the 1701; compensation earners get no P250,000 reduction. */
export function annualReturnWithEightPercent(input: AnnualReturnInput): AnnualReturnResult {
  const employers = input.employers ?? []
  const hasCompensation = employers.length > 0
  const hasBusiness = input.business !== undefined
  if (!hasCompensation && !hasBusiness) {
    throw new RangeError('Enter at least one employer or some business income')
  }

  const compensation = hasCompensation ? compensationTax(employers, input.year) : null

  let business: AnnualReturnResult['business'] = null
  let pendingCredit = 0
  if (input.business) {
    const b = input.business
    const quarterlyTaxPaid = nonNegative('quarterlyTaxPaid', b.quarterlyTaxPaid ?? 0)
    const creditableWithholding = nonNegative('creditableWithholding', b.creditableWithholding ?? 0)
    pendingCredit = nonNegative('pendingCreditableWithholding', b.pendingCreditableWithholding ?? 0)
    const eight = eightPercentTax(
      {
        grossReceipts: b.grossReceipts,
        otherNonOperatingIncome: b.otherNonOperatingIncome,
        purelySelfEmployed: !hasCompensation,
      },
      input.year,
    )
    business = { ...eight, quarterlyTaxPaid, creditableWithholding }
  }

  // Like the form: the tax, the credits and what is left are whole pesos.
  const totalTaxDue = roundToPeso((compensation?.taxDue ?? 0) + (business?.tax ?? 0))
  const totalCredits = roundToPeso(
    (compensation?.totalTaxWithheld ?? 0) + (business?.quarterlyTaxPaid ?? 0) + (business?.creditableWithholding ?? 0),
  )
  const balance = totalTaxDue - totalCredits

  return {
    year: input.year,
    form: hasCompensation && hasBusiness ? '1701' : hasBusiness ? '1701A' : '1700',
    compensation,
    business,
    graduatedBusiness: null,
    combinedTaxableIncome: null,
    totalTaxDue,
    totalCredits,
    balance,
    pendingCredit,
    balanceIfPendingCreditAllowed: roundToCentavos(balance - pendingCredit),
  }
}

/** Annual tax with the graduated rates and the 40% standard deduction (1701/1701A): net business income joins taxable pay and the table is applied once to the total. */
export function annualReturnWithGraduated(input: AnnualReturnInput): AnnualReturnResult {
  const employers = input.employers ?? []
  const hasCompensation = employers.length > 0
  if (!hasCompensation && input.business === undefined) {
    throw new RangeError('Enter at least one employer or some business income')
  }

  const compensation = hasCompensation ? compensationTax(employers, input.year) : null

  let graduatedBusiness: AnnualReturnResult['graduatedBusiness'] = null
  let pendingCredit = 0
  if (input.business) {
    const b = input.business
    const quarterlyTaxPaid = nonNegative('quarterlyTaxPaid', b.quarterlyTaxPaid ?? 0)
    const creditableWithholding = nonNegative('creditableWithholding', b.creditableWithholding ?? 0)
    pendingCredit = nonNegative('pendingCreditableWithholding', b.pendingCreditableWithholding ?? 0)
    const income = graduatedBusinessIncome(
      {
        grossReceipts: b.grossReceipts,
        otherNonOperatingIncome: b.otherNonOperatingIncome,
        deduction: b.deduction,
        itemizedExpenses: b.itemizedExpenses,
      },
      input.year,
    )
    graduatedBusiness = { ...income, quarterlyTaxPaid, creditableWithholding }
  }

  // Like the form: a business loss lowers the combined taxable income, and the tax, the credits and what is left are whole pesos.
  const combinedTaxableIncome = roundToPeso(
    (compensation?.taxableCompensation ?? 0) + (graduatedBusiness?.netBusinessIncome ?? 0),
  )
  const totalTaxDue = graduatedTaxToPeso(combinedTaxableIncome, input.year)
  const totalCredits = roundToPeso(
    (compensation?.totalTaxWithheld ?? 0) +
      (graduatedBusiness?.quarterlyTaxPaid ?? 0) +
      (graduatedBusiness?.creditableWithholding ?? 0),
  )
  const balance = totalTaxDue - totalCredits

  return {
    year: input.year,
    form: hasCompensation && graduatedBusiness ? '1701' : graduatedBusiness ? '1701A' : '1700',
    compensation,
    business: null,
    graduatedBusiness,
    combinedTaxableIncome,
    totalTaxDue,
    totalCredits,
    balance,
    pendingCredit,
    balanceIfPendingCreditAllowed: roundToCentavos(balance - pendingCredit),
  }
}
