import { Link } from 'react-router'
import type { MonthlyPayResult } from '@/engine/monthlyPay.ts'
import { MONTHLY_DE_MINIMIS_NOTE } from '@/lib/deMinimisNotes.ts'
import type { Payslip } from '@/lib/payslip.ts'
import { formatPeso } from '@/lib/peso.ts'
import { isSelfEmployed, type Taxpayer } from '@/lib/taxpayer.ts'

interface Props {
  slip: Payslip
  result: MonthlyPayResult
  taxpayer: Taxpayer
  minimumWage: boolean
}

/** The notes under the payslip: warnings first, then what the figures assume. */
export default function PayslipNotes({ slip, result, taxpayer, minimumWage }: Props) {
  const selfEmployed = isSelfEmployed(taxpayer)
  return (
    <>
      {slip.net < 0 ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {selfEmployed
            ? 'The contributions you chose come to more than your income. Check that you typed a monthly amount, not a daily one.'
            : 'SSS and PhilHealth have minimum contributions, and at this salary they come to more than the pay. Check that you typed a monthly amount, not a daily one.'}
        </p>
      ) : null}
      {/* A minimum wage earner's pay is all treated as exempt, which has its own note below. */}
      {slip.deMinimis > 0 && !minimumWage ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{MONTHLY_DE_MINIMIS_NOTE}</p>
      ) : null}
      {slip.period !== 'annual' && result.thirteenthMonth > 0 ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          13th month &amp; bonuses, once a year:{' '}
          <span className="font-mono text-[0.92em] font-medium">{formatPeso(result.thirteenthMonth)}</span>{' '}
          <span className="text-muted-foreground">(about {formatPeso(result.thirteenthMonthPerMonth)} a month)</span>
        </p>
      ) : null}
      {!selfEmployed && minimumWage ? (
        <p className="text-xs text-muted-foreground">
          Minimum wage earners are exempt from income tax on their statutory minimum wage and related pay (holiday pay,
          overtime, night differential and hazard pay). This treats all of the pay as exempt; other income, such as
          commissions, can still be taxed.
        </p>
      ) : null}
      {selfEmployed ? (
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          <li>
            SSS, PhilHealth and Pag-IBIG are optional for you and paid in full by you. They do not lower this tax: the
            8% option and the 40% deduction allow no other deductions.
          </li>
          {taxpayer.method === 'graduated' ? (
            <li>Graduated rates here use the 40% standard deduction. Percentage tax (3%) or VAT is not included.</li>
          ) : null}
          <li>SSS uses the bracket for your income and PhilHealth 5% of it. Pag-IBIG is whatever you type.</li>
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {slip.period === 'cutoff'
          ? 'A cutoff is half a month: each figure is half the monthly one, rounded to the centavo. '
          : ''}
        Tax is the year's tax divided by 12, so it is an estimate. For a full year with several jobs, use{' '}
        <Link to="/year" className="underline">
          Annual
        </Link>
        .
      </p>
    </>
  )
}
