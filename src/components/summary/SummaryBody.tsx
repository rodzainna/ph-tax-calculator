import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import { ReceiptRule } from '@/components/shared/AppCard.tsx'
import EmptyState from '@/components/shared/EmptyState.tsx'
import PesoAmount from '@/components/shared/PesoAmount.tsx'
import ProblemAlert from '@/components/shared/ProblemAlert.tsx'
import Receipt from '@/components/summary/Receipt.tsx'
import { Badge } from '@/components/ui/badge'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { headlineFor, type Headline } from '@/lib/headline.ts'

const HEADLINE_COLOR: Record<Headline['tone'], string> = {
  owe: 'text-destructive',
  ok: 'text-primary',
  neutral: 'text-foreground',
}

interface Props {
  outcome: AnnualOutcome
  /** What the figure assumes about the rest of the year, such as "Until Dec 31". */
  assumption: string
}

/** The big figure: what is left to pay or overpaid, or the whole tax when no credits are known. */
function Figure({ result, assumption }: { result: AnnualReturnResult; assumption: string }) {
  const headline = headlineFor(result)
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {headline.label} <span className="text-xs">· {assumption}</span>
      </p>
      <p className={`text-4xl font-semibold tracking-tight ${HEADLINE_COLOR[headline.tone]}`}>
        <PesoAmount value={headline.amount} size="hero" plain={headline.tone !== 'neutral'} />
      </p>
      {result.totalCredits === 0 && result.totalTaxDue > 0 ? (
        <p className="text-xs text-muted-foreground">Add tax withheld or paid to see what's left to pay.</p>
      ) : null}
    </>
  )
}

/** The figure, or why there is none: nothing entered yet, or a problem to fix. */
function Answer({ outcome, assumption }: Props) {
  if (outcome.ok) return <Figure result={outcome.result} assumption={assumption} />
  if (outcome.empty) return <EmptyState title="Your tax for the year" />
  return <ProblemAlert message={outcome.message} />
}

/** The estimate as the inside of a payslip: the title, the big figure and receipt, or why there is no figure yet. */
export default function SummaryBody({ outcome, assumption }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Tax estimate{outcome.ok ? ` · ${outcome.result.year}` : ''}
        </p>
        {outcome.ok ? <Badge variant="secondary">Form {outcome.result.form}</Badge> : null}
      </div>

      {/* Stays on the page as its contents change, so a new or changed figure is announced, with its label. */}
      <div className="space-y-1" aria-live="polite" aria-atomic="true">
        <Answer outcome={outcome} assumption={assumption} />
      </div>

      {outcome.ok ? (
        <>
          <ReceiptRule />
          <Receipt result={outcome.result} />
          {outcome.notes.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {outcome.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
