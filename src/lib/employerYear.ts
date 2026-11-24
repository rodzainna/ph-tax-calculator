import type { EmployerCompensation } from '../engine/compensationTax.ts'
import { estimateContributions } from '../engine/contributions.ts'
import { monthsWorkedInYear } from '../engine/dates.ts'
import { roundToCentavos } from '../engine/money.ts'
import {
  annualBasicPay,
  monthlyBasicSalary,
  payoutsPerYear,
  thirteenthMonthPay,
  type BasicSalaryInput,
  type PayFrequency,
} from '../engine/pay.ts'
import { CONTRIBUTIONS_FIRST_YEAR } from '../engine/rules/contributions.ts'
import { amount, checkDate, InputProblem, minIso, scale } from './scenarioInput.ts'
import {
  MONTHS_PER_BUSINESS_PERIOD,
  type ContributionEntry,
  type DeMinimisLine,
  type EmployerState,
  type FormState,
} from './yearForm.ts'

export interface EmployerDetail {
  name: string
  /** Everything received over the months counted: pay, 13th month, bonuses, benefits. */
  totalPay: number
  monthsToDate: number
  monthsCounted: number
  annualBasic: number | null
  /** 13th month earned over the months counted, paid or not. Null in payslip mode (no basic known). */
  thirteenthOwed: number | null
  thirteenthCounted: number
  deMinimisYear: number
  contributions: { sss: number; philhealth: number; pagibig: number; total: number; estimated: boolean }
  taxWithheld: number
}

/** One employer's year: what is shown for it, what the tax engine takes, and any notes about it. */
export interface EmployerYear {
  detail: EmployerDetail
  compensation: EmployerCompensation
  notes: string[]
}

/** The months a job counts: up to the as-of date, and up to the end of the scenario. */
interface JobMonths {
  where: string
  startDate: string | undefined
  monthsToDate: number
  monthsCounted: number
  /** The last month of the year the job is counted in: 0 if it is counted in none, 12 if to the year's end. */
  lastMonth: number
}

/** The figures every employer has, whichever way the pay was entered. */
interface Extras {
  taxWithheld: number
  otherPay: number
  otherBenefits: number
}

export function employerYear(form: FormState, e: EmployerState, index: number, projectionEnd: string): EmployerYear {
  const job = jobMonths(form, e, `Employer #${index + 1}`, projectionEnd)
  const { where, monthsToDate, monthsCounted } = job
  const extras: Extras = {
    taxWithheld: scale(where, amount(where, 'tax withheld', e.taxWithheld), monthsToDate, monthsCounted),
    otherPay: scale(where, amount(where, 'other taxable pay', e.otherPay), monthsToDate, monthsCounted),
    otherBenefits: amount(where, 'other benefits', e.otherBenefits),
  }
  return e.mode === 'ytd' ? fromPayslip(e, job, extras) : fromSalary(form, e, job, extras)
}

function jobMonths(form: FormState, e: EmployerState, where: string, projectionEnd: string): JobMonths {
  checkDate(where, 'start date', e.startDate)
  checkDate(where, 'end date', e.endDate)
  const startDate = e.startDate || undefined
  const jobEnd = e.endDate || undefined
  if (startDate && jobEnd && jobEnd < startDate) {
    throw new InputProblem(`${where}: the end date is before the start date.`)
  }
  // A job that ended before the as-of date is counted only up to its last day.
  const monthsToDate = monthsWorkedInYear({
    year: form.year,
    startDate,
    endDate: jobEnd && jobEnd < form.asOf ? jobEnd : form.asOf,
  })
  const endDate = jobEnd ? minIso(jobEnd, projectionEnd) : projectionEnd
  const monthsCounted = monthsWorkedInYear({ year: form.year, startDate, endDate })
  return { where, startDate, monthsToDate, monthsCounted, lastMonth: monthOfYear(endDate, form.year) }
}

/** The month number of an ISO date within `year`: 0 if the date is before the year, 12 if it is after it. */
function monthOfYear(iso: string, year: number): number {
  const dateYear = Number(iso.slice(0, 4))
  if (dateYear < year) return 0
  if (dateYear > year) return 12
  return Number(iso.slice(5, 7))
}

/** Payslip year-to-date mode: the figures typed are to the as-of date, so they are scaled up to the months counted. */
function fromPayslip(e: EmployerState, job: JobMonths, extras: Extras): EmployerYear {
  const { where, monthsToDate, monthsCounted } = job
  const toYear = (value: number) => scale(where, value, monthsToDate, monthsCounted)
  const sss = amount(where, 'SSS', e.ytdSss)
  const philhealth = amount(where, 'PhilHealth', e.ytdPhilhealth)
  const pagibig = amount(where, 'Pag-IBIG', e.ytdPagibig)
  const yearContributions = { sss: toYear(sss), philhealth: toYear(philhealth), pagibig: toYear(pagibig) }
  const contributions = roundToCentavos(
    yearContributions.sss + yearContributions.philhealth + yearContributions.pagibig,
  )
  // A payslip's taxable gross is already after contributions, so add them back for the engine.
  const regularPay = toYear(amount(where, 'taxable gross', e.ytdTaxableGross) + sss + philhealth + pagibig)
  const thirteenth = amount(where, '13th month pay', e.thirteenthCustom)
  return {
    detail: {
      name: where,
      totalPay: roundToCentavos(regularPay + extras.otherPay + thirteenth + extras.otherBenefits),
      monthsToDate,
      monthsCounted,
      annualBasic: null,
      thirteenthOwed: null,
      thirteenthCounted: thirteenth,
      deMinimisYear: 0,
      contributions: { ...yearContributions, total: contributions, estimated: false },
      taxWithheld: extras.taxWithheld,
    },
    compensation: {
      label: where,
      regularPay: regularPay + extras.otherPay,
      thirteenthMonthAndBenefits: thirteenth + extras.otherBenefits,
      deMinimisExcess: 0,
      mandatoryContributions: contributions,
      taxWithheld: extras.taxWithheld,
    },
    notes: [],
  }
}

/** Salary mode: the pay worked out from a salary rate over the months counted. */
function fromSalary(form: FormState, e: EmployerState, job: JobMonths, extras: Extras): EmployerYear {
  const { where, monthsToDate, monthsCounted } = job
  const salary: BasicSalaryInput = {
    amount: amount(where, 'basic salary', e.basic),
    frequency: e.frequency,
    monthsWorked: monthsCounted,
  }
  const annualBasic = annualBasicPay(salary)
  const owed = thirteenthMonthPay(salary)
  const thirteenth = thirteenthPaid(e, owed, where)
  const { contributions, note } = salaryContributions(form, e, job, salary)
  const deMinimis = (e.hasDeMinimis ? e.deMinimis : []).reduce(
    (sum, line) => sum + deMinimisYear(line, e.frequency, monthsCounted, where),
    0,
  )
  return {
    detail: {
      name: where,
      totalPay: roundToCentavos(annualBasic + extras.otherPay + thirteenth + extras.otherBenefits + deMinimis),
      monthsToDate,
      monthsCounted,
      annualBasic,
      thirteenthOwed: owed,
      thirteenthCounted: thirteenth,
      deMinimisYear: deMinimis,
      contributions,
      taxWithheld: extras.taxWithheld,
    },
    compensation: {
      label: where,
      regularPay: annualBasic + extras.otherPay,
      thirteenthMonthAndBenefits: thirteenth + extras.otherBenefits,
      // Ceilings per benefit type are not checked yet: de minimis is treated as tax-free.
      deMinimisExcess: 0,
      mandatoryContributions: contributions.total,
      taxWithheld: extras.taxWithheld,
    },
    notes: note ? [note] : [],
  }
}

/** The 13th month that counts: what is owed, what was typed, or nothing if it was not paid. */
function thirteenthPaid(e: EmployerState, owed: number, where: string): number {
  switch (e.thirteenthMode) {
    case 'estimate':
      return owed
    case 'custom':
      return amount(where, '13th month pay', e.thirteenthCustom)
    case 'unpaid':
      return 0
  }
}

/** SSS, PhilHealth and Pag-IBIG for the months counted: estimated from the salary, or as typed. */
function salaryContributions(
  form: FormState,
  e: EmployerState,
  { where, startDate, monthsToDate, monthsCounted, lastMonth }: JobMonths,
  salary: BasicSalaryInput,
): { contributions: EmployerDetail['contributions']; note?: string } {
  const canEstimate = form.year >= CONTRIBUTIONS_FIRST_YEAR
  // A month that was only part worked still has a whole month of contributions, so count each month the job touches.
  const firstMonth = startDate && Number(startDate.slice(0, 4)) === form.year ? Number(startDate.slice(5, 7)) : 1
  const months = monthsCounted === 0 ? 0 : Math.max(0, lastMonth - firstMonth + 1)

  if (e.contributionsMode === 'estimate' && canEstimate) {
    // No salary entered yet: nothing is deducted (the minimum contributions would otherwise apply).
    if (salary.amount === 0) {
      return { contributions: { sss: 0, philhealth: 0, pagibig: 0, total: 0, estimated: true } }
    }
    const estimate = estimateContributions({
      year: form.year,
      monthlyBasic: monthlyBasicSalary(salary),
      months,
      startMonth: firstMonth,
    })
    return {
      contributions: {
        sss: estimate.sss.total,
        philhealth: estimate.philhealth,
        pagibig: estimate.pagibig,
        total: estimate.total,
        estimated: true,
      },
    }
  }

  // Typed by the user: each of the three on its own, as a monthly, twice-a-month or overall amount.
  const typed = (label: string, entry: ContributionEntry): number => {
    const value = amount(where, label, entry.amount)
    if (entry.per === 'month') return roundToCentavos(value * months)
    if (entry.per === 'twice') return roundToCentavos(value * 2 * months)
    return scale(where, value, monthsToDate, monthsCounted)
  }
  const sss = typed('SSS', e.customContributions.sss)
  const philhealth = typed('PhilHealth', e.customContributions.philhealth)
  const pagibig = typed('Pag-IBIG', e.customContributions.pagibig)
  return {
    contributions: { sss, philhealth, pagibig, total: roundToCentavos(sss + philhealth + pagibig), estimated: false },
    // Estimating was asked for, but this year has no estimate to give.
    note:
      e.contributionsMode === 'estimate'
        ? `For ${form.year} contributions are not estimated automatically. Enter them under "More details".`
        : undefined,
  }
}

/** One de minimis benefit over the months counted, by how often it is paid. */
function deMinimisYear(line: DeMinimisLine, frequency: PayFrequency, months: number, where: string): number {
  const value = amount(where, 'a de minimis amount', line.amount)
  switch (line.per) {
    case 'year':
      return value
    case 'month':
      return value * months
    case 'quarter':
      // Four a year, over the months worked, the same way a monthly amount runs over them.
      return (value * months) / MONTHS_PER_BUSINESS_PERIOD.quarter
    case 'payout':
      return value * payoutsPerYear(frequency) * (months / MONTHS_PER_BUSINESS_PERIOD.year)
  }
}
