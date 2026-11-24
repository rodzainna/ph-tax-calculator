import { roundToCentavos } from '../engine/money.ts'
import type { MonthlyPayResult } from '../engine/monthlyPay.ts'

/** One month, one cutoff (pay twice a month), or the whole year. */
export type PayslipPeriod = 'monthly' | 'cutoff' | 'annual'

const MONTHS_IN_PERIOD: Record<PayslipPeriod, number> = { monthly: 1, cutoff: 0.5, annual: 12 }

/** The amounts as typed, per month. The result has only their total. */
export interface MonthlyLines {
  basic: number
  allowance: number
  deMinimis: number
}

export interface Payslip {
  period: PayslipPeriod
  basic: number
  allowance: number
  deMinimis: number
  gross: number
  sss: number
  philhealth: number
  pagibig: number
  /** Income tax for the period. In the annual slip it leaves out the tax the bonuses cause. */
  tax: number
  /** Contributions plus tax, the exact sum of the lines above. */
  totalDeductions: number
  /** Gross minus total deductions. */
  net: number
  /** Annual only: the 13th month and bonuses after the tax they cause. Zero otherwise. */
  netBonuses: number
}

/**
 * Builds one payslip from the monthly result. Each line is scaled and rounded on its own,
 * and the totals are summed from those rounded lines, so the slip adds up to the centavo.
 */
export function payslipFor(result: MonthlyPayResult, lines: MonthlyLines, period: PayslipPeriod): Payslip {
  const months = MONTHS_IN_PERIOD[period]
  const scaled = (monthly: number) => roundToCentavos(monthly * months)
  const isAnnual = period === 'annual'

  const sss = scaled(result.sss)
  const philhealth = scaled(result.philhealth)
  const pagibig = scaled(result.pagibig)
  const gross = scaled(result.grossMonthly)
  const tax = isAnnual ? roundToCentavos(result.taxYearly - result.taxOnBonuses) : scaled(result.taxMonthly)
  const totalDeductions = roundToCentavos(sss + philhealth + pagibig + tax)

  return {
    period,
    basic: scaled(lines.basic),
    allowance: scaled(lines.allowance),
    deMinimis: scaled(lines.deMinimis),
    gross,
    sss,
    philhealth,
    pagibig,
    tax,
    totalDeductions,
    net: roundToCentavos(gross - totalDeductions),
    netBonuses: isAnnual ? roundToCentavos(result.thirteenthMonth - result.taxOnBonuses) : 0,
  }
}
