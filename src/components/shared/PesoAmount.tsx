import type { CSSProperties } from 'react'
import { splitPeso } from '@/lib/peso.ts'
import { cn } from '@/lib/utils'

const SIZES = {
  /** The big number on a result card. */
  hero: {
    symbol: 'mr-1 align-[0.55em] text-[0.5em] font-semibold',
    fraction: 'text-[0.5em] font-semibold opacity-85',
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

/**
 * About how wide a hero figure is, in ems of its own text. A mono character is at most 0.6em; the half-size peso sign,
 * its margin and the half-size cents add about 1.4em.
 */
const heroEms = (signAndWhole: string): number => signAndWhole.length * 0.6 + 1.4

/**
 * An amount with a small raised peso sign and muted cents; it reads exactly like formatPeso for copying and screen
 * readers. A hero figure too wide for its box is scaled down to fit, because a cut-off amount would read as a different
 * one.
 */
export default function PesoAmount({ value, size, plain, className }: Props) {
  const { sign, symbol, whole, fraction } = splitPeso(Number.isFinite(value) ? value : 0)
  const s = SIZES[size]
  const isHero = size === 'hero'
  const amount = (
    <span
      className={cn(
        'font-mono tabular-nums',
        isHero && '[font-size:min(1em,calc(100cqi/var(--figure-ems)))]',
        className,
      )}
      style={isHero ? ({ '--figure-ems': heroEms(sign + whole) } as CSSProperties) : undefined}
    >
      {sign}
      <span className={cn(s.symbol, !plain && 'text-brand-gradient')}>{symbol}</span>
      {whole}
      <span className={s.fraction}>.{fraction}</span>
    </span>
  )
  return isHero ? <span className="@container block">{amount}</span> : amount
}
