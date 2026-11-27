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

/** The most characters a figure can have at the normal size, and at the next size down. */
const FITS_AT_BASE = 8
const FITS_AT_SMALL = 10

/** Long figures step down a size so they always fit a small tile (mono digits are wide). */
function valueSize(value: string): string {
  if (value.length > FITS_AT_SMALL) return 'text-xs'
  if (value.length > FITS_AT_BASE) return 'text-sm'
  return 'text-base'
}

/** One figure on its own card, under its label and an optional ⓘ. */
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
