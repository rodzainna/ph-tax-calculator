import type { PayFrequency } from '../engine/pay.ts'
import { initialTaxpayer, type Taxpayer } from './taxpayer.ts'
import { capTaxYear } from './taxYears.ts'

/** How often an amount repeats: each month, each quarter, or once a year. */
export type Recurrence = 'month' | 'quarter' | 'year'

export type EarningsMode = 'rate' | 'ytd'
/** How often a benefit is paid: each cutoff (each payout of your payroll), monthly, quarterly or once a year. */
export type DeMinimisPer = 'payout' | Recurrence
export type ThirteenthMode = 'estimate' | 'unpaid' | 'custom'
export type ContributionsMode = 'estimate' | 'custom'
export type BusinessFrequency = Recurrence
export type ExpensePer = Recurrence
export type BusinessDeductionChoice = 'osd' | 'itemized'
/** How a typed contribution is meant: each month, each payout of a twice-a-month payroll, or the whole total. */
export type ContributionPer = 'month' | 'twice' | 'overall'

export const MONTHS_PER_BUSINESS_PERIOD: Record<BusinessFrequency, number> = { month: 1, quarter: 3, year: 12 }

export interface ContributionEntry {
  amount: string
  per: ContributionPer
}

export interface DeMinimisLine {
  id: number
  label: string
  amount: string
  per: DeMinimisPer
  /** Set once Per is picked by hand. Changing how the salary is paid then leaves it alone. */
  perChosen?: boolean
}

/** Everything is raw text from the inputs so people can type freely. */
export interface EmployerState {
  id: number
  /** First day of the job if it started this year; blank means it started before the year (counts from Jan 1). */
  startDate: string
  /** Last day of the job; blank means still working here (present). */
  endDate: string
  mode: EarningsMode
  // Salary-rate mode
  basic: string
  frequency: PayFrequency
  /** De minimis benefits are hidden until switched on; when off they count as zero. */
  hasDeMinimis: boolean
  deMinimis: DeMinimisLine[]
  thirteenthMode: ThirteenthMode
  thirteenthCustom: string
  contributionsMode: ContributionsMode
  /** Typed SSS, PhilHealth and Pag-IBIG, used when contributionsMode is 'custom'. */
  customContributions: { sss: ContributionEntry; philhealth: ContributionEntry; pagibig: ContributionEntry }
  // Payslip year-to-date mode
  ytdTaxableGross: string
  ytdSss: string
  ytdPhilhealth: string
  ytdPagibig: string
  // Both modes: to the as-of date
  taxWithheld: string
  otherPay: string
  otherBenefits: string
}

/** One business expense for itemizing: a name, an amount, and how often it is paid. */
export interface ExpenseLine {
  id: number
  label: string
  amount: string
  per: ExpensePer
}

export interface BusinessState {
  enabled: boolean
  amount: string
  frequency: BusinessFrequency
  /** First day the income came in; blank means January 1 of the tax year. */
  startDate: string
  /** Last day the income came in; blank means it is still coming (present). */
  endDate: string
  otherIncome: string
  quarterlyPaid: string
  credit2307: string
  /** Graduated rates only: the 40% standard deduction or the actual expenses. */
  deduction: BusinessDeductionChoice
  expenses: ExpenseLine[]
}

export interface FormState {
  year: number
  taxpayer: Taxpayer
  /** Last day counted: the date the figures are "to" (ISO, YYYY-MM-DD). */
  asOf: string
  employers: EmployerState[]
  business: BusinessState
  /** The next free id for an employer or a row, so new ones never reuse an id. */
  nextId: number
}

/** Today as YYYY-MM-DD, in the browser's time zone. */
export const todayIso = (): string => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** The benefit frequency that matches how the salary is paid. Pay twice a month comes in cutoffs. */
const BENEFIT_PER: Record<PayFrequency, DeMinimisPer> = { monthly: 'month', 'semi-monthly': 'payout', yearly: 'year' }

export const newDeMinimisLine = (id: number, frequency: PayFrequency): DeMinimisLine => ({
  id,
  label: '',
  amount: '',
  per: BENEFIT_PER[frequency],
})

/**
 * Changes how the salary is paid. A benefit follows it while it has no amount and its Per was never picked. Any other
 * benefit keeps its Per. The yearly total of one paid each cutoff still changes with the number of cutoffs.
 */
export function withPayFrequency(employer: EmployerState, frequency: PayFrequency): EmployerState {
  return {
    ...employer,
    frequency,
    deMinimis: employer.deMinimis.map((line) =>
      line.amount.trim() === '' && !line.perChosen ? { ...line, per: BENEFIT_PER[frequency] } : line,
    ),
  }
}

export const newEmployer = (id: number, lineId: number): EmployerState => ({
  id,
  startDate: '',
  endDate: '',
  mode: 'rate',
  basic: '',
  frequency: 'monthly',
  hasDeMinimis: false,
  deMinimis: [newDeMinimisLine(lineId, 'monthly')],
  thirteenthMode: 'estimate',
  thirteenthCustom: '',
  contributionsMode: 'estimate',
  customContributions: {
    sss: { amount: '', per: 'month' },
    philhealth: { amount: '', per: 'month' },
    pagibig: { amount: '', per: 'month' },
  },
  ytdTaxableGross: '',
  ytdSss: '',
  ytdPhilhealth: '',
  ytdPagibig: '',
  taxWithheld: '',
  otherPay: '',
  otherBenefits: '',
})

export const newExpenseLine = (id: number): ExpenseLine => ({ id, label: '', amount: '', per: 'month' })

export const newBusiness = (lineId: number): BusinessState => ({
  enabled: false,
  amount: '',
  frequency: 'month',
  startDate: '',
  endDate: '',
  otherIncome: '',
  quarterlyPaid: '',
  credit2307: '',
  deduction: 'osd',
  expenses: [newExpenseLine(lineId)],
})

/**
 * A blank form with one employer and the business section off. It starts on the year `today` falls in, but no later
 * than the latest year with rules; the figures are counted up to `today`.
 */
export function initialForm(today: string = todayIso()): FormState {
  let nextId = 1
  const takeId = () => nextId++
  return {
    year: capTaxYear(Number(today.slice(0, 4))),
    taxpayer: initialTaxpayer(),
    asOf: today,
    employers: [newEmployer(takeId(), takeId())],
    business: newBusiness(takeId()),
    nextId,
  }
}

/** What a scenario assumes about the rest of the year. */
export interface Scenario {
  /** Last day counted for every employer (ISO). Dec 31 = full-year projection; the as-of date = "so far". */
  projectionEnd: string
}

export const endOfYearIso = (year: number): string => `${year}-12-31`

/** The scenario "full year at the same pace": every employer counted to Dec 31. */
export const yearEndScenario = (year: number): Scenario => ({ projectionEnd: endOfYearIso(year) })

/** The scenario "so far": counted only up to the as-of date. */
export const soFarScenario = (asOf: string): Scenario => ({ projectionEnd: asOf })

/** Switches between employee, self-employed and mixed income. The business section is on for the last two. */
export function withTaxpayer(form: FormState, taxpayer: Taxpayer): FormState {
  return { ...form, taxpayer, business: { ...form.business, enabled: taxpayer.type !== 'employee' } }
}

/** The date if it falls in the year, otherwise blank. A blank date stays blank. */
const keepIfInYear = (date: string, year: number): string => (date.startsWith(`${year}-`) ? date : '')

/**
 * Switches the tax year and clears any start or end date that falls outside the new year.
 * The as-of date is left alone on purpose: counting stops at Dec 31 of the year, so a later as-of date means the whole year.
 */
export function withYear(form: FormState, year: number): FormState {
  return {
    ...form,
    year,
    employers: form.employers.map((e) => ({
      ...e,
      startDate: keepIfInYear(e.startDate, year),
      endDate: keepIfInYear(e.endDate, year),
    })),
    business: {
      ...form.business,
      startDate: keepIfInYear(form.business.startDate, year),
      endDate: keepIfInYear(form.business.endDate, year),
    },
  }
}
