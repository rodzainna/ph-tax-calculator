import { useState } from 'react'
import EmptyState from '@/components/shared/EmptyState.tsx'
import PesoAmount from '@/components/shared/PesoAmount.tsx'
import ProblemAlert from '@/components/shared/ProblemAlert.tsx'
import SegmentedControl, { type SegmentOption } from '@/components/shared/SegmentedControl.tsx'
import { ReceiptCard } from '@/components/shared/AppCard.tsx'
import MobileResultBar from '@/components/summary/MobileResultBar.tsx'
import { employeeRates } from '@/engine/contributions.ts'
import type { Outcome } from '@/lib/monthlyOutcome.ts'
import { payslipFor, type PayslipPeriod } from '@/lib/payslip.ts'
import { isSelfEmployed, type Taxpayer } from '@/lib/taxpayer.ts'
import PayslipBody from './PayslipBody.tsx'
import PayslipNotes from './PayslipNotes.tsx'
import { PAYSLIP_ID, takeHomeLabel } from './payslipView.ts'

interface Props {
  year: number
  outcome: Outcome
  taxpayer: Taxpayer
  minimumWage: boolean
}

const EMPLOYEE_PERIODS: Array<SegmentOption<PayslipPeriod>> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'cutoff', label: 'Cutoff' },
  { value: 'annual', label: 'Annual' },
]
// The self-employed are not paid in cutoffs, so that view does not exist for them.
const SELF_EMPLOYED_PERIODS = EMPLOYEE_PERIODS.filter((option) => option.value !== 'cutoff')
const TITLE_ID = 'payslip-title'

/** The payslip: a period switch, then the slip, a prompt for a salary, or what went wrong. On a phone, a bar keeps the take-home in view. */
export default function PayslipCard({ year, outcome, taxpayer, minimumWage }: Props) {
  const [period, setPeriod] = useState<PayslipPeriod>('monthly')
  const selfEmployed = isSelfEmployed(taxpayer)
  // Switching to the self-employed while on the cutoff view falls back to the month.
  const activePeriod: PayslipPeriod = selfEmployed && period === 'cutoff' ? 'monthly' : period

  const slip = outcome.ok ? payslipFor(outcome.result, outcome.lines, activePeriod) : null
  // The rate next to each contribution (SSS 5% and so on), for employees. The self-employed pay differently.
  const rates = outcome.ok && !selfEmployed ? employeeRates(year, outcome.lines.basic) : null

  return (
    <>
      <ReceiptCard className="h-fit" role="region" aria-labelledby={TITLE_ID}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id={TITLE_ID} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Payslip estimate · {year}
          </p>
          <SegmentedControl<PayslipPeriod>
            label="Payslip period"
            value={activePeriod}
            onChange={setPeriod}
            options={selfEmployed ? SELF_EMPLOYED_PERIODS : EMPLOYEE_PERIODS}
          />
        </div>

        {!outcome.ok ? (
          <div className="mt-4">
            {outcome.empty ? <EmptyState title="Your take-home pay" /> : <ProblemAlert message={outcome.message} />}
          </div>
        ) : slip ? (
          <PayslipBody slip={slip} isSelfEmployed={selfEmployed} rates={rates}>
            <PayslipNotes slip={slip} result={outcome.result} taxpayer={taxpayer} minimumWage={minimumWage} />
          </PayslipBody>
        ) : null}
      </ReceiptCard>

      {slip ? (
        <MobileResultBar label={takeHomeLabel(selfEmployed, activePeriod)} targetId={PAYSLIP_ID}>
          <PesoAmount value={slip.net} size="total" plain />
        </MobileResultBar>
      ) : null}
    </>
  )
}
