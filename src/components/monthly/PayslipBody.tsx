import type { ReactNode } from 'react'
import MoneyRow from '@/components/shared/MoneyRow.tsx'
import PesoAmount from '@/components/shared/PesoAmount.tsx'
import { ReceiptRule } from '@/components/shared/AppCard.tsx'
import type { EmployeeRates } from '@/engine/contributions.ts'
import type { Payslip } from '@/lib/payslip.ts'
import { formatPeso, formatRate } from '@/lib/peso.ts'
import { cn } from '@/lib/utils'
import { takeHomeLabel } from './payslipView.ts'

interface Props {
  slip: Payslip
  isSelfEmployed: boolean
  /** The rate shown next to each contribution. Not for the self-employed, who pay differently. */
  rates: EmployeeRates | null
  children?: ReactNode
}

/** An amount in the billions steps down a size, so it still fits a very narrow screen. */
const netSize = (amount: string): string => (amount.length > 15 ? 'text-xl' : 'text-2xl')

/** The payslip itself: what comes in, what comes off, and what is left. */
export default function PayslipBody({ slip, isSelfEmployed, rates, children }: Props) {
  const isAnnual = slip.period === 'annual'
  // The self-employed only see the contributions they added.
  const showSss = !isSelfEmployed || slip.sss > 0
  const showPhilhealth = !isSelfEmployed || slip.philhealth > 0
  const showPagibig = !isSelfEmployed || slip.pagibig > 0

  return (
    <div className="mt-4 space-y-4" aria-live="polite">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{takeHomeLabel(isSelfEmployed, slip.period)}</p>
        <p className="text-4xl font-semibold tracking-tight text-net">
          <PesoAmount value={slip.net} size="hero" plain />
        </p>
        {/* The year's 13th month and bonuses are shown apart, after the tax they cause. */}
        {isAnnual && slip.netBonuses > 0 ? (
          <p className="text-sm text-muted-foreground">
            + <span className="font-mono text-[0.92em]">{formatPeso(slip.netBonuses)}</span> net 13th month &amp;
            bonuses
          </p>
        ) : null}
      </div>

      <ReceiptRule />

      <dl className="space-y-2">
        {isSelfEmployed ? null : <MoneyRow label="Basic salary" amount={slip.basic} />}
        {slip.allowance > 0 ? <MoneyRow label="Taxable allowance" amount={slip.allowance} sign="plus" /> : null}
        {slip.deMinimis > 0 ? <MoneyRow label="De minimis" amount={slip.deMinimis} sign="plus" /> : null}
        <MoneyRow
          strong
          label={isSelfEmployed ? 'Gross income' : 'Gross pay'}
          amount={slip.gross}
          hint={
            isSelfEmployed
              ? 'What you receive, before any deduction.'
              : 'Basic salary plus allowances and de minimis benefits, before any deduction.'
          }
        />
      </dl>

      <ReceiptRule />

      <dl className="space-y-2">
        {showSss ? (
          <MoneyRow
            tone="deduction"
            label="SSS"
            tag={rates ? formatRate(rates.sss) : undefined}
            amount={slip.sss}
            sign="minus"
          />
        ) : null}
        {showPhilhealth ? (
          <MoneyRow
            tone="deduction"
            label="PhilHealth"
            tag={rates ? formatRate(rates.philhealth) : undefined}
            amount={slip.philhealth}
            sign="minus"
          />
        ) : null}
        {showPagibig ? (
          <MoneyRow
            tone="deduction"
            label="Pag-IBIG"
            tag={rates ? formatRate(rates.pagibig) : undefined}
            amount={slip.pagibig}
            sign="minus"
          />
        ) : null}
        <MoneyRow
          tone="deduction"
          label={isSelfEmployed ? 'Income tax' : 'Withholding tax'}
          amount={slip.tax}
          sign="minus"
          hint={
            isAnnual
              ? "Your income tax for the year, apart from the tax your 13th month and bonuses cause. An employer's actual withholding can differ a little."
              : "Your annual income tax divided by 12 (and by 2 for a cutoff). An employer's actual withholding can differ a little."
          }
        />
        <MoneyRow strong tone="deduction" label="Total deductions" amount={slip.totalDeductions} sign="minus" />
      </dl>

      <ReceiptRule />

      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-base font-semibold">{isSelfEmployed ? 'Net income' : 'Net pay'}</p>
        <p className={cn('ml-auto font-mono font-semibold tabular-nums text-net', netSize(formatPeso(slip.net)))}>
          {formatPeso(slip.net)}
        </p>
      </div>

      {children}
    </div>
  )
}
