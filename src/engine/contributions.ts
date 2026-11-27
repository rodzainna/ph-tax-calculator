import { UnsupportedYearError } from './graduatedTax.ts'
import { roundToCentavos } from './money.ts'
import {
  CONTRIBUTIONS_FIRST_YEAR,
  PAGIBIG_RULES,
  PHILHEALTH_RULES,
  SSS_RULES,
  type YearMonth,
} from './rules/contributions.ts'

const isOnOrAfter = (a: YearMonth, b: YearMonth): boolean =>
  a.year > b.year || (a.year === b.year && a.month >= b.month)

/** The rule in force for a month: the latest one whose start is on or before it. */
function ruleAt<T extends { from: YearMonth }>(rules: T[], at: YearMonth): T {
  let found: T | undefined
  for (const rule of rules) {
    if (isOnOrAfter(at, rule.from)) found = rule
  }
  if (!found) throw new UnsupportedYearError(at.year)
  return found
}

export interface MonthlyContributions {
  sss: { msc: number; regular: number; mpf: number; total: number }
  philhealth: number
  pagibig: number
  total: number
}

export interface MonthlyPay {
  /** Monthly basic salary: the base for PhilHealth and Pag-IBIG. */
  monthlyBasic: number
  /** Monthly compensation used for SSS. Defaults to the basic salary. */
  monthlySssBase?: number
}

function checkYear(year: number): void {
  if (year < CONTRIBUTIONS_FIRST_YEAR) throw new UnsupportedYearError(year)
}

function checkAmount(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a number of 0 or more, got ${value}`)
  }
}

/** The employee's SSS, PhilHealth and Pag-IBIG contributions for one month. */
export function monthlyContributions(year: number, month: number, pay: MonthlyPay): MonthlyContributions {
  checkYear(year)
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`month must be 1 to 12, got ${month}`)
  checkAmount('monthlyBasic', pay.monthlyBasic)
  const sssBase = pay.monthlySssBase ?? pay.monthlyBasic
  checkAmount('monthlySssBase', sssBase)
  const at = { year, month }

  // SSS: the compensation falls in a bracket of width `step` centred on the MSC.
  const s = ruleAt(SSS_RULES, at)
  const bracketed = Math.floor((sssBase + s.step / 2) / s.step) * s.step
  const msc = Math.min(s.maxMsc, Math.max(s.minMsc, bracketed))
  const regular = roundToCentavos(Math.min(msc, s.mpfThreshold) * s.employeeRate)
  const mpf = roundToCentavos(Math.max(0, msc - s.mpfThreshold) * s.employeeRate)

  // PhilHealth: a straight percentage of basic salary between the floor and the ceiling, split equally.
  const p = ruleAt(PHILHEALTH_RULES, at)
  const insured = Math.min(p.ceiling, Math.max(p.floor, pay.monthlyBasic))
  const philhealth = roundToCentavos(insured * p.rate * p.employeeShare)

  // Pag-IBIG: 2% of the monthly fund salary up to the cap (1% at or below the low threshold).
  const g = ruleAt(PAGIBIG_RULES, at)
  const fundSalary = Math.min(g.cap, pay.monthlyBasic)
  const pagibig = roundToCentavos(fundSalary * (fundSalary <= g.lowThreshold ? g.lowRate : g.employeeRate))

  const sss = { msc, regular, mpf, total: roundToCentavos(regular + mpf) }
  return { sss, philhealth, pagibig, total: roundToCentavos(sss.total + philhealth + pagibig) }
}

export interface SelfEmployedContributions {
  /** The member chooses the MSC; this uses the bracket that matches the income. */
  sss: { msc: number; total: number }
  philhealth: number
}

/**
 * One month of SSS and PhilHealth for a self-employed person, who pays the whole of both. SSS uses the salary credit that
 * matches the income, which is only a default because the member can choose otherwise. PhilHealth uses the income, kept
 * between its floor and ceiling.
 */
export function selfEmployedContributions(
  year: number,
  month: number,
  pay: { monthlyIncome: number },
): SelfEmployedContributions {
  checkYear(year)
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`month must be 1 to 12, got ${month}`)
  checkAmount('monthlyIncome', pay.monthlyIncome)
  const at = { year, month }

  const s = ruleAt(SSS_RULES, at)
  const bracketed = Math.floor((pay.monthlyIncome + s.step / 2) / s.step) * s.step
  const msc = Math.min(s.maxMsc, Math.max(s.minMsc, bracketed))

  const p = ruleAt(PHILHEALTH_RULES, at)
  const insured = Math.min(p.ceiling, Math.max(p.floor, pay.monthlyIncome))

  return { sss: { msc, total: roundToCentavos(msc * s.totalRate) }, philhealth: roundToCentavos(insured * p.rate) }
}

export interface ContributionEstimateInput extends MonthlyPay {
  year: number
  /** Number of months worked in the year, 0 to 12. */
  months: number
  /** First month worked (1 = January). Defaults to 1. */
  startMonth?: number
}

export interface ContributionEstimate {
  year: number
  months: number
  sss: { regular: number; mpf: number; total: number }
  philhealth: number
  pagibig: number
  total: number
}

/** The employee's yearly contributions: the monthly amounts added up over the months worked. */
export function estimateContributions(input: ContributionEstimateInput): ContributionEstimate {
  const { year, months } = input
  const startMonth = input.startMonth ?? 1
  if (!Number.isInteger(months) || months < 0 || months > 12)
    throw new RangeError(`months must be 0 to 12, got ${months}`)
  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
    throw new RangeError(`startMonth must be 1 to 12, got ${startMonth}`)
  }
  if (startMonth + months - 1 > 12) throw new RangeError('The months worked run past December')
  checkYear(year)

  let regular = 0
  let mpf = 0
  let philhealth = 0
  let pagibig = 0
  for (let month = startMonth; month < startMonth + months; month++) {
    const m = monthlyContributions(year, month, input)
    regular += m.sss.regular
    mpf += m.sss.mpf
    philhealth += m.philhealth
    pagibig += m.pagibig
  }
  const sss = { regular: roundToCentavos(regular), mpf: roundToCentavos(mpf), total: roundToCentavos(regular + mpf) }
  philhealth = roundToCentavos(philhealth)
  pagibig = roundToCentavos(pagibig)
  return { year, months, sss, philhealth, pagibig, total: roundToCentavos(sss.total + philhealth + pagibig) }
}

export interface EmployeeRates {
  /** SSS: the employee's share of the monthly salary credit, as a fraction (0.05 is 5%). */
  sss: number
  /** PhilHealth: the employee's half of the premium rate, on salary between the floor and the ceiling. */
  philhealth: number
  /** Pag-IBIG: 2% of the fund salary, or 1% at or below the low threshold. */
  pagibig: number
}

/** The rate behind each contribution line, from the same rules the amounts use. For showing "SSS 5%" next to the figure. */
export function employeeRates(year: number, monthlyBasic: number): EmployeeRates {
  checkYear(year)
  checkAmount('monthlyBasic', monthlyBasic)
  // December carries the latest rule of the year, as in monthlyPay.
  const at = { year, month: 12 }
  const s = ruleAt(SSS_RULES, at)
  const p = ruleAt(PHILHEALTH_RULES, at)
  const g = ruleAt(PAGIBIG_RULES, at)
  const fundSalary = Math.min(g.cap, monthlyBasic)
  return {
    sss: s.employeeRate,
    philhealth: Number((p.rate * p.employeeShare).toFixed(6)),
    pagibig: fundSalary <= g.lowThreshold ? g.lowRate : g.employeeRate,
  }
}
