import { useId } from 'react'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import InfoTip from '@/components/shared/InfoTip.tsx'
import MoneyRow from '@/components/shared/MoneyRow.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EmployerDetail } from '@/lib/computeScenario.ts'
import { formatPeso } from '@/lib/peso.ts'
import { withheldProjection, type WithheldProjection } from '@/lib/withheldProjection.ts'
import type { EmployerState } from '@/lib/yearForm.ts'

interface Props {
  index: number
  employer: EmployerState
  /** The figures worked out for this employer. Missing while the form has a problem or nothing is entered. */
  detail?: EmployerDetail
  onTaxWithheldChange: (value: string) => void
}

/** The 13th month row: what is owed from the salary, or only what was entered when the pay comes from a payslip. */
function thirteenthRow(employer: EmployerState, detail: EmployerDetail | undefined) {
  if (employer.mode === 'ytd') {
    return {
      amount: detail?.thirteenthCounted ?? null,
      hint: 'What you entered under "Also received". Left out if blank.',
      note: undefined,
    }
  }
  return {
    amount: detail?.thirteenthOwed ?? null,
    hint: 'Paid before Dec 24, or in your final pay.',
    note: employer.thirteenthMode === 'unpaid' ? 'Not counted (unpaid)' : undefined,
  }
}

/** A small summary beside each employer card: the figures worked out for that job. */
export default function EmployerSummary({ index, employer, detail, onTaxWithheldChange }: Props) {
  const titleId = useId()
  const contributions = detail?.contributions
  const thirteenth = thirteenthRow(employer, detail)
  const projection = withheldProjection(employer.taxWithheld, detail)

  return (
    // A group named by its title, so the Tax withheld field here can be told apart from the one in the employer card.
    <SoftCard accent className="h-full" role="group" aria-labelledby={titleId}>
      {/* The same header as the employer card beside it (a 40px row, title centred), so the two titles line up. */}
      <CardHeader className="flex min-h-10 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle id={titleId}>Summary Employer #{index + 1}</CardTitle>
        {detail ? (
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {detail.monthsCounted.toFixed(1)} months
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          <dl>
            <MoneyRow
              strong
              label="Total pay"
              amount={detail?.totalPay ?? null}
              hint="Pay, 13th month and benefits for the months counted."
            />
          </dl>
          <dl className="border-t pt-2.5">
            <MoneyRow label="13th month" amount={thirteenth.amount} hint={thirteenth.hint} note={thirteenth.note} />
          </dl>
          <dl className="space-y-1.5 border-t pt-2.5">
            <MoneyRow label="SSS" amount={contributions?.sss ?? null} />
            <MoneyRow label="PhilHealth" amount={contributions?.philhealth ?? null} />
            <MoneyRow label="Pag-IBIG" amount={contributions?.pagibig ?? null} />
          </dl>
        </div>
        {/* The same value as Tax withheld in the employer card, so it can be changed from either place. */}
        <div className="mt-2.5 border-t pt-2.5">
          <PesoInput
            compact
            label="Tax withheld"
            value={employer.taxWithheld}
            onChange={onTaxWithheldChange}
            // A projected figure stays in view under the field. Without one, a short ⓘ explains the field.
            hint={
              projection ? <ProjectedWithheld projection={projection} hasEndDate={employer.endDate !== ''} /> : null
            }
            info={projection ? undefined : 'Tax this employer has withheld from your pay so far this year.'}
          />
        </div>
      </CardContent>
    </SoftCard>
  )
}

/** The projection runs to the job's end date, or to Dec 31 when it has none. */
function ProjectedWithheld({ projection, hasEndDate }: { projection: WithheldProjection; hasEndDate: boolean }) {
  const until = hasEndDate ? 'the end date' : 'Dec 31'
  return (
    <span className="inline-flex items-center gap-1">
      Projected to {until}: <span className="font-medium text-foreground">{formatPeso(projection.amount)}</span>
      <InfoTip about="the projected tax withheld" contentClassName="max-w-60">
        What you typed is what has been withheld so far this year ({projection.monthsSoFar.toFixed(1)} months). The
        estimate covers the whole period, so it assumes the same amount is withheld every month until {until}. Once this
        job has ended, set its end date and nothing more is projected.
      </InfoTip>
    </span>
  )
}
