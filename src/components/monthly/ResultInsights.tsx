import BracketCard from '@/components/insights/BracketCard.tsx'
import StatTile from '@/components/insights/StatTile.tsx'
import { benefitsCeilingFor } from '@/engine/compensationTax.ts'
import type { MonthlyPayResult } from '@/engine/monthlyPay.ts'
import { formatPeso, formatPesoWhole } from '@/lib/peso.ts'
import { isSelfEmployed, type Taxpayer } from '@/lib/taxpayer.ts'

interface Props {
  result: MonthlyPayResult
  year: number
  taxpayer: Taxpayer
}

/** Three figures at a glance, then where the income sits in the tax table. */
export default function ResultInsights({ result, year, taxpayer }: Props) {
  const selfEmployed = isSelfEmployed(taxpayer)
  const { method } = taxpayer
  const effectiveRate = result.annualGross > 0 ? `${((result.taxYearly / result.annualGross) * 100).toFixed(1)}%` : '—'

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Annual tax"
          value={formatPesoWhole(result.taxYearly)}
          info="Your income tax for the whole year at this pay. The monthly tax is this divided by 12."
        />
        <StatTile
          label="Effective rate"
          value={effectiveRate}
          info={
            selfEmployed
              ? 'Your annual tax as a share of everything you receive in the year.'
              : 'Your annual tax as a share of everything you earn in the year (salary, allowance and 13th month), before deductions.'
          }
        />
        {selfEmployed ? (
          <StatTile
            label="Tax option"
            value={method === 'eight-percent' ? '8% flat' : 'Graduated'}
            info={
              method === 'eight-percent'
                ? '8% of your receipts above ₱250,000, in place of the graduated rates and the percentage tax.'
                : 'The graduated rates on what is left after the 40% standard deduction.'
            }
          />
        ) : (
          <StatTile
            label="Bonus tax"
            value={formatPesoWhole(result.taxOnBonuses)}
            info={`Extra tax caused by the part of your 13th month and bonuses above the ${formatPeso(benefitsCeilingFor(year))} exempt amount. It is zero while they stay under it.`}
          />
        )}
      </div>
      {/* The 8% option has no brackets, so there is nothing to place the income in. */}
      {selfEmployed && method === 'eight-percent' ? null : (
        <BracketCard taxableIncome={result.taxableIncomeYearly} year={year} />
      )}
    </>
  )
}
