import { SoftCard } from '@/components/shared/AppCard.tsx'
import LabelWithTip from '@/components/shared/LabelWithTip.tsx'
import { CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  /** The figure, already formatted. */
  value: string
  /** What the number means, in an ⓘ next to the label. */
  info?: string
}

/** Long figures step down a size so they always fit a small tile (mono digits are wide). */
const valueSize = (value: string): string =>
  value.length > 10 ? 'text-xs' : value.length > 8 ? 'text-sm' : 'text-base'

/** One figure on its own small card, the standard card with the accent bar: a quiet label (with an ⓘ) over a bold number. */
export default function StatTile({ label, value, info }: Props) {
  return (
    <SoftCard accent>
      <CardContent className="space-y-1.5">
        <p className="text-xs font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
          <LabelWithTip label={label} hint={info} contentClassName="normal-case tracking-normal" />
        </p>
        <p className={cn('font-mono font-semibold tabular-nums tracking-tight', valueSize(value))}>{value}</p>
      </CardContent>
    </SoftCard>
  )
}
