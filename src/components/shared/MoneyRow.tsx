import type { ReactNode } from 'react'
import LabelWithTip from '@/components/shared/LabelWithTip.tsx'
import { formatPeso } from '@/lib/peso.ts'
import { cn } from '@/lib/utils'

interface Props {
  label: ReactNode
  /** The amount in pesos, or null for "—" when there is nothing to show yet. */
  amount: number | null
  /** Money coming off (−) or added (+). The amount itself stays positive. */
  sign?: 'minus' | 'plus'
  /** Bold row, for subtotals and totals. */
  strong?: boolean
  /** A subtotal: bold, with a thin rule above it. */
  subtotal?: boolean
  /** A small line under the label. */
  note?: string
  /** An ⓘ next to the label with a short explanation. */
  hint?: string
  /** A small note right after the label, such as the rate: "5%". */
  tag?: string
  /** 'deduction' draws the amount in red, for money taken off. */
  tone?: 'deduction'
}

const SIGN_TEXT = { minus: '−', plus: '+' } as const

/** A deduction is red. A faded amount keeps its colour, only lighter. */
function amountColor(red: boolean, faded: boolean): string | undefined {
  if (red) return faded ? 'text-destructive/45' : 'text-destructive'
  return faded ? 'text-muted-foreground/60' : undefined
}

/** One "label ........ amount" line inside a <dl>. Used by every summary and breakdown. */
export default function MoneyRow({ label, amount, sign, strong, subtotal, note, hint, tag, tone }: Props) {
  const bold = strong || subtotal
  const red = tone === 'deduction'
  // A zero is faded so the other amounts are easier to find. Totals stay at full strength.
  const faded = amount === 0 && !bold

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 text-sm',
        bold && 'font-semibold',
        subtotal && 'mt-1 border-t border-foreground/10 pt-2',
      )}
    >
      <dt className={cn('min-w-0', bold ? 'text-foreground' : 'text-muted-foreground')}>
        <LabelWithTip
          label={label}
          after={tag ? <span className="ml-1.5 text-xs font-normal text-muted-foreground/80">{tag}</span> : null}
          hint={hint}
        />
      </dt>
      <dd
        className={cn(
          'shrink-0 whitespace-nowrap font-mono text-[0.92em] tabular-nums',
          !bold && 'font-medium',
          amountColor(red, faded),
        )}
      >
        {amount === null ? (
          '—'
        ) : (
          <>
            {sign ? (
              <>
                <span
                  className={cn('mr-1.5 font-normal', red ? 'text-destructive/70' : 'text-muted-foreground')}
                  aria-hidden
                >
                  {SIGN_TEXT[sign]}
                </span>
                <span className="sr-only">{sign === 'minus' ? 'minus ' : 'plus '}</span>
              </>
            ) : null}
            {formatPeso(amount)}
          </>
        )}
      </dd>
      {note ? <dd className="col-span-2 text-xs font-normal leading-snug text-muted-foreground">{note}</dd> : null}
    </div>
  )
}
