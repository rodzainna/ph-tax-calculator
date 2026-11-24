import InfoTip from '@/components/shared/InfoTip.tsx'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import { CardContent } from '@/components/ui/card'
import { bracketPosition, shortPeso } from '@/lib/bracket.ts'
import { formatPeso, formatRate } from '@/lib/peso.ts'
import { cn } from '@/lib/utils'

/** From low to high rates: sage and teal for the low brackets, warming up through peach to coral for the high ones. */
const RAMP = ['sage', 'sky', 'blush', 'rose', 'coral', 'coral-deep'].map((name) => `var(--color-brand-${name})`)

interface Props {
  /** Annual taxable income: the amount the tax table is applied to. */
  taxableIncome: number
  year: number
  /** What the figure is called under the amount. */
  caption?: string
}

/** Where your income sits in the year's tax table: six segments, one per rate, with a "You" marker on yours. */
export default function BracketCard({ taxableIncome, year, caption = 'annual taxable income' }: Props) {
  const { segments, index, fraction, rate } = bracketPosition(taxableIncome, year)
  // Where the marker goes along the bar: the segments are the same width, and it sits part-way through its own.
  const left = ((index + fraction) / segments.length) * 100
  const headline = rate === 0 ? 'No income tax' : `${formatRate(rate)} on the excess`

  return (
    <SoftCard accent>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your tax bracket
              <InfoTip
                about="your tax bracket"
                className="ml-1 inline-block align-[-2px]"
                contentClassName="normal-case tracking-normal"
              >
                Each rate applies only to the part of your income inside its bracket, not to all of it.
              </InfoTip>
            </p>
            <p className="text-xl font-semibold tracking-tight">{headline}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">{formatPeso(taxableIncome)}</p>
            <p className="text-xs text-muted-foreground">{caption}</p>
          </div>
        </div>

        {/* The same thing in words for screen readers; the bar and labels below are the picture of it. */}
        <p className="sr-only">
          Your annual taxable income of {formatPeso(taxableIncome)} is in the {formatRate(rate)} bracket.
        </p>
        <div aria-hidden className="relative pt-8">
          <div
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center" // Kept inside the bar so the "You" pill is never cut off at zero income or at the top rate.
            style={{ left: `clamp(1.25rem, ${left}%, calc(100% - 1.25rem))` }}
          >
            <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background shadow-sm">
              You
            </span>
            <span className="h-3 w-0.5 bg-foreground" />
          </div>
          <div className="flex gap-0.5">
            {segments.map((s, i) => (
              <div
                key={s.from}
                className={cn(
                  'h-3 flex-1 transition-opacity',
                  i === 0 && 'rounded-l-full',
                  i === segments.length - 1 && 'rounded-r-full',
                  i !== index && 'opacity-60',
                )}
                style={{ backgroundColor: RAMP[Math.min(i, RAMP.length - 1)] }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-0.5 text-center">
            {segments.map((s, i) => (
              <div key={s.from} className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', i === index ? 'text-foreground' : 'text-muted-foreground')}>
                  {formatRate(s.rate)}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {s.to === null ? `>${shortPeso(s.from)}` : `≤${shortPeso(s.to)}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </SoftCard>
  )
}
