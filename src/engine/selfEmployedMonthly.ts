import { selfEmployedContributions } from './contributions.ts'
import { eightPercentTax } from './eightPercentTax.ts'
import { graduatedBusinessIncome } from './graduatedBusiness.ts'
import { graduatedTaxToPeso } from './graduatedTax.ts'
import { roundToCentavos } from './money.ts'
import type { MonthlyPayResult } from './monthlyPay.ts'

export interface SelfEmployedMonthlyInput {
  year: number
  /** The 8% option, or the graduated rates with the 40% optional standard deduction. */
  method: 'eight-percent' | 'graduated'
  /** Gross receipts in a typical month, before any tax withheld by clients. */
  monthlyIncome: number
  /** Whether you pay SSS and PhilHealth. They are optional for the self-employed, so they default to off. */
  paysSss?: boolean
  paysPhilhealth?: boolean
  /** What you put into Pag-IBIG each month, typed by you (0 if none). Its rules for the self-employed are not estimated. */
  monthlyPagibig?: number
}

function check(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
}

/** One month of a self-employed person's income in the employee shape: chosen contributions (not deductible under the 8% or 40% options), tax as the year's divided by 12, no 13th month. */
export function selfEmployedMonthlyPay(input: SelfEmployedMonthlyInput): MonthlyPayResult {
  check('monthlyIncome', input.monthlyIncome)
  const pagibig = roundToCentavos(input.monthlyPagibig ?? 0)
  check('monthlyPagibig', pagibig)

  const yearlyReceipts = roundToCentavos(12 * input.monthlyIncome)
  // What the tax is worked out on: the 8% option taxes the receipts above 250,000 (no brackets);
  // the graduated rates tax what is left after the 40% deduction.
  let taxYearly: number
  let taxableIncomeYearly: number
  if (input.method === 'eight-percent') {
    const eight = eightPercentTax({ grossReceipts: yearlyReceipts, purelySelfEmployed: true }, input.year)
    taxYearly = eight.tax
    taxableIncomeYearly = eight.taxableBase
  } else {
    taxableIncomeYearly = graduatedBusinessIncome({ grossReceipts: yearlyReceipts }, input.year).netBusinessIncome
    taxYearly = graduatedTaxToPeso(taxableIncomeYearly, input.year)
  }

  // With no income there is nothing to base the contributions on (the minimums would otherwise apply).
  // selfEmployedContributions also rejects years it has no rules for, so it runs either way.
  const base = selfEmployedContributions(input.year, 12, { monthlyIncome: input.monthlyIncome })
  const has = input.monthlyIncome > 0
  const sss = has && input.paysSss ? base.sss.total : 0
  const philhealth = has && input.paysPhilhealth ? base.philhealth : 0
  const contributions = roundToCentavos(sss + philhealth + pagibig)

  const taxMonthly = roundToCentavos(taxYearly / 12)
  return {
    year: input.year,
    grossMonthly: roundToCentavos(input.monthlyIncome),
    sss,
    philhealth,
    pagibig,
    contributions,
    taxMonthly,
    takeHomeMonthly: roundToCentavos(input.monthlyIncome - contributions - taxMonthly),
    thirteenthMonth: 0,
    thirteenthMonthPerMonth: 0,
    taxYearly,
    annualGross: yearlyReceipts,
    taxableIncomeYearly,
    taxOnBonuses: 0,
  }
}
