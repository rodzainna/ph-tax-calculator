import {
  annualReturnWithEightPercent,
  annualReturnWithGraduated,
  type AnnualReturnResult,
} from '../engine/annualReturn.ts'
import { parseIsoDate } from '../engine/dates.ts'
import { EightPercentNotAvailableError } from '../engine/eightPercentTax.ts'
import { UnsupportedYearError } from '../engine/graduatedTax.ts'
import { businessYear } from './businessYear.ts'
import { employerYear, type EmployerDetail } from './employerYear.ts'
import { formatPeso } from './peso.ts'
import { UNEXPECTED_PROBLEM } from './problem.ts'
import { InputProblem } from './scenarioInput.ts'
import { usesBusiness, usesEmployers, type TaxpayerType } from './taxpayer.ts'
import type { FormState, Scenario } from './yearForm.ts'

export type { EmployerDetail }

export type AnnualOutcome =
  | { ok: true; result: AnnualReturnResult; details: EmployerDetail[]; notes: string[] }
  | { ok: false; message: string; /** True when there is simply nothing entered yet, not a problem. */ empty?: boolean }

/** Works out the year's tax from the form, counting every job and the business up to the scenario's end date. */
export function computeScenario(form: FormState, scenario: Scenario): AnnualOutcome {
  try {
    parseIsoDate(form.asOf)
    parseIsoDate(scenario.projectionEnd)
    const { taxpayer } = form
    const { type, method } = taxpayer
    // Employee: salary only. Self-employed: business only. Mixed: both.
    const withEmployers = usesEmployers(taxpayer)
    const withBusiness = usesBusiness(taxpayer)

    const years = (withEmployers ? form.employers : []).map((e, i) => employerYear(form, e, i, scenario.projectionEnd))
    const employers = years.map((y) => y.compensation)
    const details = years.map((y) => y.detail)
    const business = withBusiness ? businessYear(form, form.business, scenario.projectionEnd) : undefined

    const hasAnything =
      employers.some((e) => e.regularPay > 0 || e.thirteenthMonthAndBenefits > 0) ||
      (business?.grossReceipts ?? 0) > 0 ||
      (business?.otherNonOperatingIncome ?? 0) > 0
    if (!hasAnything) return { ok: false, message: emptyMessage(type), empty: true }

    const graduated = withBusiness && method === 'graduated'
    const result = graduated
      ? annualReturnWithGraduated({ year: form.year, employers, business })
      : annualReturnWithEightPercent({ year: form.year, employers, business })

    const payslipMode = withEmployers && form.employers.some((e) => e.mode === 'ytd')
    // Two employers can give the same note, and it should be said once.
    const notes = [
      ...new Set([...years.flatMap((y) => y.notes), ...resultNotes(result, details, { graduated, payslipMode })]),
    ]
    return { ok: true, result, details, notes }
  } catch (error) {
    return problem(error)
  }
}

function emptyMessage(type: TaxpayerType): string {
  switch (type) {
    case 'self-employed':
      return 'Add what you receive from your business or freelance work and your estimate shows up here.'
    case 'mixed':
      return 'Add a basic salary for an employer or what you receive from your business and your estimate shows up here.'
    case 'employee':
      return 'Add a basic salary for an employer and your estimate shows up here.'
  }
}

/** What to tell the person about how the result was reached. */
function resultNotes(
  result: AnnualReturnResult,
  details: EmployerDetail[],
  { graduated, payslipMode }: { graduated: boolean; payslipMode: boolean },
): string[] {
  const notes: string[] = []
  if (graduated) {
    const itemized = result.graduatedBusiness?.deductionKind === 'itemized'
    notes.push(
      itemized
        ? 'Itemized: only the expenses you list are deducted, and you need receipts and books to support them. SSS, PhilHealth and Pag-IBIG you pay yourself can be listed as expenses.'
        : 'The 40% standard deduction replaces all business expenses, including the contributions you pay yourself.',
    )
    if (result.graduatedBusiness?.isLoss) {
      notes.push(
        'Your expenses are more than your receipts, so the business shows a loss. Like the BIR form, it lowers your other taxable income. Carrying a loss forward to later years is not handled yet.',
      )
    }
    notes.push('Percentage tax (3%) or VAT on your sales is separate and not included.')
  }
  if (details.some((d) => d.deMinimisYear > 0)) {
    notes.push(
      'De minimis benefits are treated as tax-free, as your payslip does. Checking them against the legal limits is coming.',
    )
  }
  if (payslipMode) {
    notes.push(
      'Payslip mode: the 13th month is left out unless you enter it (it is mostly exempt up to the ₱90,000 shared ceiling).',
    )
  }
  return notes
}

/** A thrown error as a message for the person. Only messages written for them are shown as they are. */
function problem(error: unknown): AnnualOutcome {
  if (error instanceof EightPercentNotAvailableError) {
    return {
      ok: false,
      message: `The 8% option only covers up to ${formatPeso(error.threshold)} a year. Your business income is ${formatPeso(error.base)}, so the 8% option is not available. Choose Graduated rates instead.`,
    }
  }
  if (error instanceof InputProblem || error instanceof UnsupportedYearError)
    return { ok: false, message: error.message }
  return { ok: false, message: UNEXPECTED_PROBLEM }
}
