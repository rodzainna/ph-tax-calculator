import { EightPercentNotAvailableError } from '../engine/eightPercentTax.ts'
import { monthlyPay, type MonthlyPayResult } from '../engine/monthlyPay.ts'
import { selfEmployedMonthlyPay } from '../engine/selfEmployedMonthly.ts'
import type { MonthlyLines } from './payslip.ts'
import { formatPeso, parsePeso } from './peso.ts'
import { initialTaxpayer, isSelfEmployed, type Taxpayer } from './taxpayer.ts'

/** What the Monthly page works out from the typed figures: a result, or the reason there is none. */
export type Outcome =
  { ok: true; result: MonthlyPayResult; lines: MonthlyLines } | { ok: false; message: string; empty?: boolean }

/** Everything the Monthly page lets you type or switch. The amounts are text, so blanks and mistakes reach us. */
export interface MonthlyForm {
  year: number
  taxpayer: Taxpayer
  basic: string
  allowance: string
  deMinimis: string
  /** The yearly 13th month and bonuses. Null until typed, when it follows one month of basic pay. */
  bonus: string | null
  minimumWage: boolean
  paysSss: boolean
  paysPhilhealth: boolean
  pagibig: string
}

export const initialMonthlyForm = (year: number): MonthlyForm => ({
  year,
  taxpayer: initialTaxpayer(),
  basic: '',
  allowance: '',
  deMinimis: '',
  bonus: null,
  minimumWage: false,
  paysSss: false,
  paysPhilhealth: false,
  pagibig: '',
})

/** The form with the bonus settled: what was typed, or one month of basic pay. */
export type MonthlyInput = Omit<MonthlyForm, 'bonus'> & { bonus: string }

/** Works out one month of pay, or says why it cannot: nothing typed yet, a bad number, or a case the rules rule out. */
export function monthlyOutcome(input: MonthlyInput): Outcome {
  const { year, taxpayer } = input
  const selfEmployed = isSelfEmployed(taxpayer)
  // The fields of the other taxpayer type are ignored, even if something was typed in them before switching.
  const numbers = {
    basic: parsePeso(input.basic),
    deMinimis: selfEmployed ? 0 : parsePeso(input.deMinimis),
    allowance: selfEmployed ? 0 : parsePeso(input.allowance),
    bonus: selfEmployed ? 0 : parsePeso(input.bonus),
    pagibig: selfEmployed ? parsePeso(input.pagibig) : 0,
  }
  if (Object.values(numbers).some(Number.isNaN)) {
    return { ok: false, message: 'One of the amounts is not a valid number.' }
  }
  if (numbers.basic === 0) {
    return {
      ok: false,
      message: selfEmployed
        ? 'Enter what you receive in a month and we work out your income tax, and the contributions you choose to pay.'
        : 'Enter your monthly salary and we work out SSS, PhilHealth, Pag-IBIG and tax for you.',
      empty: true,
    }
  }

  const lines: MonthlyLines = { basic: numbers.basic, allowance: numbers.allowance, deMinimis: numbers.deMinimis }
  try {
    const result = selfEmployed
      ? selfEmployedMonthlyPay({
          year,
          method: taxpayer.method,
          monthlyIncome: numbers.basic,
          paysSss: input.paysSss,
          paysPhilhealth: input.paysPhilhealth,
          monthlyPagibig: numbers.pagibig,
        })
      : monthlyPay({
          year,
          monthlyBasic: numbers.basic,
          monthlyDeMinimis: numbers.deMinimis,
          monthlyTaxableAllowance: numbers.allowance,
          yearlyBonuses: numbers.bonus,
          isMinimumWageEarner: input.minimumWage,
        })
    return { ok: true, result, lines }
  } catch (error) {
    if (error instanceof EightPercentNotAvailableError) {
      return {
        ok: false,
        message: `The 8% option only covers up to ${formatPeso(error.threshold)} a year, and ${formatPeso(error.base)} a year is over that. Choose Graduated rates instead.`,
      }
    }
    // The engine's own wording is for developers, so the person sees a plain message instead.
    return { ok: false, message: 'Those figures could not be worked out. Check the amounts and the tax year.' }
  }
}
