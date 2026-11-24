import type { AnnualReturnResult } from '../engine/annualReturn.ts'
import { graduatedTaxToPeso } from '../engine/graduatedTax.ts'
import { roundToCentavos, roundToPeso } from '../engine/money.ts'

// The figures behind the yearly estimate: gross - deductions = taxable income, then tax, credits and the balance.
// All of them are read from the engine's result. The engine rounds taxable income to a whole peso, as the form does,
// so with centavos typed in, gross - deductions can be off from taxable income by less than half a peso.

/**
 * Everything received in the year before any deduction: pay and benefits, and business receipts and other income.
 * Under the 8% option the business part is already a whole peso, as on the form.
 */
export function grossIncome(r: AnnualReturnResult): number {
  const comp = r.compensation ? r.compensation.totalRegularPay + r.compensation.benefitsPool : 0
  const eight = r.business ? r.business.base : 0
  const graduated = r.graduatedBusiness
    ? r.graduatedBusiness.grossReceipts + r.graduatedBusiness.otherNonOperatingIncome
    : 0
  return roundToCentavos(comp + eight + graduated)
}

/** What the tax is worked out on. Under the 8% option it is the receipts above the reduction, with no brackets. */
export function taxableIncome(r: AnnualReturnResult): number {
  return roundToCentavos(
    (r.compensation?.taxableCompensation ?? 0) +
      (r.business?.taxableBase ?? 0) +
      (r.graduatedBusiness?.netBusinessIncome ?? 0),
  )
}

export interface DeductionParts {
  /** SSS, PhilHealth and Pag-IBIG taken off pay. */
  contributions: number
  /** The part of the 13th month and benefits that is exempt (up to the shared ceiling). */
  exemptBenefits: number
  /** The 40% or itemized deduction (graduated), or the 250,000 reduction (8%), as it actually reduced the income. */
  business: number
  total: number
}

/**
 * What the business deduction took off: the 40% or itemized deduction (graduated) or the 250,000 reduction (8%).
 * Worked out as gross minus net, so the parts always add up, even when a loss makes the taxable income negative.
 */
function businessDeduction(r: AnnualReturnResult): number {
  const graduated = r.graduatedBusiness
  if (graduated) {
    return roundToCentavos(graduated.grossReceipts + graduated.otherNonOperatingIncome - graduated.netBusinessIncome)
  }
  if (r.business) return roundToCentavos(r.business.base - r.business.taxableBase)
  return 0
}

/** The deductions that take gross income down to taxable income. The three parts always add up to the total. */
export function deductions(r: AnnualReturnResult): DeductionParts {
  const contributions = r.compensation?.totalMandatoryContributions ?? 0
  const exemptBenefits = r.compensation?.benefitsExempt ?? 0
  const business = businessDeduction(r)
  return { contributions, exemptBenefits, business, total: roundToCentavos(contributions + exemptBenefits + business) }
}

/** The year's tax as a share of everything received, or 0 when nothing was received. */
export function effectiveRate(r: AnnualReturnResult): number {
  const gross = grossIncome(r)
  return gross > 0 ? r.totalTaxDue / gross : 0
}

type GraduatedBusiness = NonNullable<AnnualReturnResult['graduatedBusiness']>

/** Pay plus net business income: what the graduated rates are applied to when there is graduated business income. */
function combinedIncome(r: AnnualReturnResult, graduated: GraduatedBusiness): number {
  return (
    r.combinedTaxableIncome ?? roundToPeso((r.compensation?.taxableCompensation ?? 0) + graduated.netBusinessIncome)
  )
}

/** Extra tax from the 13th month and benefits above the exempt ceiling: tax with them minus without, in whole pesos. */
export function taxOnBenefits(r: AnnualReturnResult): number {
  const comp = r.compensation
  if (!comp || comp.benefitsTaxable === 0) return 0
  // With graduated business income the tax is one computation over pay plus business; otherwise pay is taxed alone.
  const base = r.graduatedBusiness ? combinedIncome(r, r.graduatedBusiness) : comp.taxableCompensation
  return graduatedTaxToPeso(base, r.year) - graduatedTaxToPeso(base - comp.benefitsTaxable, r.year)
}

/** The income to place in the bracket bar, or null when there are no brackets to show (the 8% option on its own). */
export function bracketIncome(r: AnnualReturnResult): number | null {
  if (r.graduatedBusiness) return combinedIncome(r, r.graduatedBusiness)
  if (r.compensation) return r.compensation.taxableCompensation
  return null
}
