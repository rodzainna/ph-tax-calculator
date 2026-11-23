import { compensationTax } from './compensationTax.ts'
import { monthlyContributions } from './contributions.ts'
import { roundToCentavos } from './money.ts'

export interface MonthlyPayInput {
  year: number
  /** Monthly basic salary: the base for SSS, PhilHealth and Pag-IBIG here. */
  monthlyBasic: number
  /** Taxable allowance received every month, on top of the basic. */
  monthlyTaxableAllowance?: number
  /** De minimis benefits received every month. Treated as tax-free. */
  monthlyDeMinimis?: number
  /** Whether a 13th month pay (one month of basic) is received once a year. Defaults to true. Ignored when `yearlyBonuses` is given. */
  receivesThirteenthMonth?: boolean
  /** The year's 13th month pay and bonuses together, in pesos. When given, it replaces the one-month default (0 means none). */
  yearlyBonuses?: number
  /** A minimum wage earner is exempt from income tax; this treats all pay as exempt, though the law covers only the minimum wage and related pay. */
  isMinimumWageEarner?: boolean
}

export interface MonthlyPayResult {
  year: number
  /** Basic + taxable allowance + de minimis for one month. */
  grossMonthly: number
  sss: number
  philhealth: number
  pagibig: number
  contributions: number
  /** Income tax for one month: the year's tax, as if you worked all twelve months, divided by 12. */
  taxMonthly: number
  /** What lands in your account in a normal month. */
  takeHomeMonthly: number
  /** 13th month pay and bonuses received once a year (one month of basic unless `yearlyBonuses` was given), and what it adds per month on average. */
  thirteenthMonth: number
  thirteenthMonthPerMonth: number
  /** The whole year's income tax behind taxMonthly. */
  taxYearly: number
  /** What the year's pay adds up to before any deduction: twelve months of pay and allowance, plus the 13th month. The base for the effective tax rate. */
  annualGross: number
  /** The income the year's tax is worked out on (after contributions, plus the taxable part of the 13th month). Where you sit in the tax table. */
  taxableIncomeYearly: number
  /** Extra tax caused by the part of the 13th month and benefits above the exempt amount. Zero while they stay under it. */
  taxOnBonuses: number
}

function check(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
}

/** One month of a salary: contributions, income tax and take-home, with tax estimated as the year's tax divided by 12 (payroll withholding can differ). */
export function monthlyPay(input: MonthlyPayInput): MonthlyPayResult {
  const allowance = input.monthlyTaxableAllowance ?? 0
  const deMinimis = input.monthlyDeMinimis ?? 0
  const receivesThirteenth = input.receivesThirteenthMonth ?? true
  check('monthlyBasic', input.monthlyBasic)
  check('monthlyTaxableAllowance', allowance)
  check('monthlyDeMinimis', deMinimis)

  // December carries the latest rule of the year (for example Pag-IBIG's 2024 cap).
  const none = { sss: { msc: 0, regular: 0, mpf: 0, total: 0 }, philhealth: 0, pagibig: 0, total: 0 }
  // With no salary there is nothing to deduct (the minimum contributions would otherwise apply).
  // monthlyContributions still validates the year, so unsupported years are rejected either way.
  const rules = monthlyContributions(input.year, 12, { monthlyBasic: input.monthlyBasic })
  const c = input.monthlyBasic === 0 ? none : rules
  if (input.yearlyBonuses !== undefined) check('yearlyBonuses', input.yearlyBonuses)
  const thirteenthMonth =
    input.yearlyBonuses !== undefined ? roundToCentavos(input.yearlyBonuses) : receivesThirteenth ? roundToCentavos(input.monthlyBasic) : 0

  const tax = compensationTax(
    [
      {
        label: 'Employer',
        regularPay: roundToCentavos(12 * (input.monthlyBasic + allowance)),
        thirteenthMonthAndBenefits: thirteenthMonth,
        deMinimisExcess: 0,
        mandatoryContributions: roundToCentavos(12 * c.total),
        taxWithheld: 0,
      },
    ],
    input.year,
  )

  // The tax again with no 13th month at all: the difference is the tax the bonuses cause.
  const withoutBonuses = compensationTax(
    [
      {
        label: 'Employer',
        regularPay: roundToCentavos(12 * (input.monthlyBasic + allowance)),
        thirteenthMonthAndBenefits: 0,
        deMinimisExcess: 0,
        mandatoryContributions: roundToCentavos(12 * c.total),
        taxWithheld: 0,
      },
    ],
    input.year,
  )

  // A minimum wage earner pays no income tax; everything else about the pay is the same.
  const exempt = input.isMinimumWageEarner === true
  const taxYearly = exempt ? 0 : tax.taxDue
  const taxMonthly = roundToCentavos(taxYearly / 12)
  const grossMonthly = roundToCentavos(input.monthlyBasic + allowance + deMinimis)
  return {
    year: input.year,
    grossMonthly,
    sss: c.sss.total,
    philhealth: c.philhealth,
    pagibig: c.pagibig,
    contributions: c.total,
    taxMonthly,
    takeHomeMonthly: roundToCentavos(grossMonthly - c.total - taxMonthly),
    thirteenthMonth,
    thirteenthMonthPerMonth: roundToCentavos(thirteenthMonth / 12),
    taxYearly,
    annualGross: roundToCentavos(12 * (input.monthlyBasic + allowance) + thirteenthMonth),
    taxableIncomeYearly: exempt ? 0 : tax.taxableCompensation,
    taxOnBonuses: exempt ? 0 : roundToCentavos(tax.taxDue - withoutBonuses.taxDue),
  }
}
