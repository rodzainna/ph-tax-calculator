import { splitPeso } from '@/lib/peso.ts'
import { cn } from '@/lib/utils'

const SIZES = {
  /** The big number on a result card. */
  hero: {
    symbol: 'mr-1 align-[0.55em] text-[0.5em] font-semibold',
    fraction: 'text-[0.5em] font-semibold opacity-60',
  },
  /** A highlighted total inside a card. */
  total: {
    symbol: 'mr-0.5 align-[0.15em] text-[0.7em] font-medium',
    fraction: 'text-[0.75em] font-medium opacity-65',
  },
}

interface Props {
  value: number
  size: keyof typeof SIZES
  /** Draw the peso sign in the surrounding text colour instead of the brand gradient (for a red or teal result). */
  plain?: boolean
  className?: string
}

/** An amount with a small raised peso sign and quiet cents; it reads exactly like formatPeso for copying and screen readers. */
export default function PesoAmount({ value, size, plain, className }: Props) {
  const { sign, symbol, whole, fraction } = splitPeso(Number.isFinite(value) ? value : 0)
  const s = SIZES[size]
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {sign}
      <span className={cn(s.symbol, !plain && 'text-brand-gradient')}>{symbol}</span>
      {whole}
      <span className={s.fraction}>.{fraction}</span>
    </span>
  )
}
