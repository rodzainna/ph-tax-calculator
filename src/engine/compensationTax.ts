import { graduatedTaxToPeso, UnsupportedYearError } from './graduatedTax.ts'
import { roundToCentavos, roundToPeso } from './money.ts'
import { BENEFITS_CEILING_RULES } from './rules/benefits.ts'

/** One employer's figures for the year, as they appear on a BIR Form 2316 or payslips. */
export interface EmployerCompensation {
  /** A name to tell the employers apart in the result. */
  label: string
  /** Regular taxable pay before contributions (basic, taxable allowances, overtime); not the 13th month, benefits or exempt de minimis. */
  regularPay: number
  /** 13th month pay, Christmas bonus, productivity incentives and other benefits received. */
  thirteenthMonthAndBenefits: number
  /** De minimis benefits above their legal ceilings. They join the benefits pool. */
  deMinimisExcess: number
  /** Employee share of SSS, PhilHealth and Pag-IBIG (and union dues) deducted in the year. */
  mandatoryContributions: number
  /** Income tax withheld by this employer for the year. */
  taxWithheld: number
}

export interface CompensationTaxResult {
  year: number
  employers: Array<{ label: string; regularPay: number; taxWithheld: number }>
  totalRegularPay: number
  totalMandatoryContributions: number
  /** All 13th month, other benefits and excess de minimis, across every employer. */
  benefitsPool: number
  benefitsCeiling: number
  /** The part of the pool that is exempt (never more than the ceiling). */
  benefitsExempt: number
  /** The part of the pool above the ceiling, added to taxable compensation. */
  benefitsTaxable: number
  taxableCompensation: number
  taxDue: number
  totalTaxWithheld: number
  /** taxDue - totalTaxWithheld. Positive: still payable. Negative: overpaid. */
  balance: number
}

export function benefitsCeilingFor(year: number): number {
  const rule = BENEFITS_CEILING_RULES.find(
    (r) => year >= r.fromYear && (r.toYear === null || year <= r.toYear),
  )
  if (!rule) throw new UnsupportedYearError(year)
  return rule.ceiling
}

const NUMERIC_FIELDS = [
  'regularPay',
  'thirteenthMonthAndBenefits',
  'deMinimisExcess',
  'mandatoryContributions',
  'taxWithheld',
] as const

function validate(employer: EmployerCompensation): void {
  for (const field of NUMERIC_FIELDS) {
    const value = employer[field]
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${employer.label}: ${field} must be a number of 0 or more, got ${value}`)
    }
  }
}

const sum = (values: number[]): number => roundToCentavos(values.reduce((a, b) => a + b, 0))

/** Annual tax on compensation from one or more employers (BIR 1700): the P90,000 benefits ceiling applies once to the pooled benefits, then the graduated table, less tax withheld. */
export function compensationTax(employers: EmployerCompensation[], year: number): CompensationTaxResult {
  employers.forEach(validate)
  const benefitsCeiling = benefitsCeilingFor(year)

  const totalRegularPay = sum(employers.map((e) => e.regularPay))
  const totalMandatoryContributions = sum(employers.map((e) => e.mandatoryContributions))
  const benefitsPool = sum(employers.map((e) => e.thirteenthMonthAndBenefits + e.deMinimisExcess))
  const benefitsExempt = Math.min(benefitsPool, benefitsCeiling)
  const benefitsTaxable = roundToCentavos(benefitsPool - benefitsExempt)

  // Like the form: the taxable amount and the tax on it are whole pesos.
  const taxableCompensation = roundToPeso(totalRegularPay - totalMandatoryContributions + benefitsTaxable)
  const taxDue = graduatedTaxToPeso(taxableCompensation, year)
  const totalTaxWithheld = sum(employers.map((e) => e.taxWithheld))

  return {
    year,
    employers: employers.map((e) => ({ label: e.label, regularPay: e.regularPay, taxWithheld: e.taxWithheld })),
    totalRegularPay,
    totalMandatoryContributions,
    benefitsPool,
    benefitsCeiling,
    benefitsExempt,
    benefitsTaxable,
    taxableCompensation,
    taxDue,
    totalTaxWithheld,
    balance: roundToCentavos(taxDue - totalTaxWithheld),
  }
}
