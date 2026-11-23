import { roundToCentavos } from './money.ts'

export type PayFrequency = 'monthly' | 'semi-monthly' | 'yearly'

const PAYOUTS_PER_YEAR: Record<PayFrequency, number> = {
  monthly: 12,
  'semi-monthly': 24,
  yearly: 1,
}

/** How many times a year a salary of this frequency is paid. */
export function payoutsPerYear(frequency: PayFrequency): number {
  return PAYOUTS_PER_YEAR[frequency]
}

export interface BasicSalaryInput {
  /** The amount paid each time (each payout, or the whole year for 'yearly'). */
  amount: number
  frequency: PayFrequency
  /** Months worked in the year, 0 to 12. */
  monthsWorked: number
}

function validate(input: BasicSalaryInput): void {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new RangeError(`amount must be a number of 0 or more, got ${input.amount}`)
  }
  if (!Number.isFinite(input.monthsWorked) || input.monthsWorked < 0 || input.monthsWorked > 12) {
    throw new RangeError(`monthsWorked must be 0 to 12, got ${input.monthsWorked}`)
  }
}

/** The basic salary for one month: what contributions are based on. */
export function monthlyBasicSalary(input: BasicSalaryInput): number {
  validate(input)
  return roundToCentavos((input.amount * PAYOUTS_PER_YEAR[input.frequency]) / 12)
}

/** The basic salary earned over the months worked. */
export function annualBasicPay(input: BasicSalaryInput): number {
  validate(input)
  return roundToCentavos((input.amount * PAYOUTS_PER_YEAR[input.frequency] * input.monthsWorked) / 12)
}

/** Estimated 13th month pay: one-twelfth of the basic salary earned in the year (PD 851), computed once so part-year work is covered. */
export function thirteenthMonthPay(input: BasicSalaryInput): number {
  return roundToCentavos(annualBasicPay(input) / 12)
}
