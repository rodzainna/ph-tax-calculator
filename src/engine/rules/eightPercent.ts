/**
 * The 8% option: NIRC Sec. 24(A)(2)(b)-(c) as amended by RA 10963. No P250,000 reduction for someone who also earns
 * pay. The VAT threshold is P3,000,000 (Sec. 109(BB)).
 */
export interface EightPercentRule {
  fromYear: number
  toYear: number | null
  rate: number
  /** Gross sales/receipts + other non-operating income may not exceed this. */
  threshold: number
  /** Reduction from the base for purely self-employed taxpayers only. */
  reduction: number
  source: string
  verified: boolean
}

export const EIGHT_PERCENT_RULES: EightPercentRule[] = [
  {
    fromYear: 2018,
    toYear: null,
    rate: 0.08,
    threshold: 3_000_000,
    reduction: 250_000,
    source: 'RA 10963 Sec. 5 (NIRC Sec. 24(A)(2)(b),(c)); VAT threshold NIRC Sec. 109(BB)',
    verified: true,
  },
]
