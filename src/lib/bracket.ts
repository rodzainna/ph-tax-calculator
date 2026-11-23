import { graduatedRulesFor } from '../engine/graduatedTax.ts'

export interface BracketSegment {
  /** The tax rate on the part of income inside this segment, as a fraction (0.15 is 15%). */
  rate: number
  /** Where the segment starts, in pesos. */
  from: number
  /** Where it ends, or null for the top one, which has no end. */
  to: number | null
}

/** The year's tax brackets as segments for the bracket bar. They come straight from the rules data. */
export function bracketSegments(year: number): BracketSegment[] {
  const { brackets } = graduatedRulesFor(year)
  return brackets.map((b, i) => ({ rate: b.rate, from: b.over, to: brackets[i + 1]?.over ?? null }))
}

export interface BracketPosition {
  segments: BracketSegment[]
  /** Which segment the income falls in. */
  index: number
  /** How far through that segment it is, from 0 to 1 (the top segment has no end, so it is shown part-way). */
  fraction: number
  /** The rate on the next peso earned. */
  rate: number
}

/** Where an annual taxable income sits in the tax table; an income exactly on a boundary stays in the lower segment, like the tax. */
export function bracketPosition(taxableIncome: number, year: number): BracketPosition {
  const segments = bracketSegments(year)
  const income = Number.isFinite(taxableIncome) ? Math.max(0, taxableIncome) : 0
  let index = 0
  segments.forEach((s, i) => {
    if (income > s.from) index = i
  })
  const s = segments[index]
  // The first segment's lower edge is 0, which a zero income is not "over"; it still belongs there.
  const fraction = s.to === null ? 0.5 : Math.min(1, Math.max(0, (income - s.from) / (s.to - s.from)))
  return { segments, index, fraction, rate: s.rate }
}

/** 250000 -> "250K", 2000000 -> "2M": short enough for a label under a bar. */
export function shortPeso(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`
  return `${amount / 1_000}K`
}
