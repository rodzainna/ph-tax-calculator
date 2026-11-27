/**
 * Yearly ceiling on the tax-free 13th month and other benefits: P90,000, NIRC Sec. 32(B)(7)(e) as amended by RA 10963.
 * Keyed by year because RR 11-2018 allows it to change.
 */
export interface BenefitsCeilingRule {
  fromYear: number
  toYear: number | null
  ceiling: number
  source: string
  verified: boolean
}

export const BENEFITS_CEILING_RULES: BenefitsCeilingRule[] = [
  {
    fromYear: 2018,
    toYear: null,
    ceiling: 90_000,
    source: 'RA 10963 Sec. 9 (NIRC Sec. 32(B)(7)(e)); BIR RR 11-2018',
    verified: true,
  },
]
