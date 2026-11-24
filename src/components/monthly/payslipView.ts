import type { PayslipPeriod } from '@/lib/payslip.ts'

/** The element the phone bar watches: the payslip and the figures under it. */
export const PAYSLIP_ID = 'payslip'

const PERIOD_LABEL: Record<PayslipPeriod, string> = { monthly: 'per month', cutoff: 'per cutoff', annual: 'per year' }

/** "Take-home pay per month", as the headline above the figure and the label on the phone bar. */
export function takeHomeLabel(isSelfEmployed: boolean, period: PayslipPeriod): string {
  return `${isSelfEmployed ? 'Take-home income' : 'Take-home pay'} ${PERIOD_LABEL[period]}`
}
