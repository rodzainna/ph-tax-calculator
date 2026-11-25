import { benefitsCeilingFor } from '@/engine/compensationTax.ts'
import { formatPeso } from '@/lib/peso.ts'

/** What the "Bonus tax" figure means, with the year's exempt amount. */
export const bonusTaxInfo = (year: number): string =>
  `Extra tax caused by the part of your 13th month and bonuses above the ${formatPeso(benefitsCeilingFor(year))} exempt amount. It is zero while they stay under it.`
