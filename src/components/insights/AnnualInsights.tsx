import { bonusTaxInfo } from '@/components/insights/bonusTaxInfo.ts'
import BracketCard from '@/components/insights/BracketCard.tsx'
import StatRow from '@/components/insights/StatRow.tsx'
import StatTile from '@/components/insights/StatTile.tsx'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import { eightPercentRulesFor } from '@/engine/eightPercentTax.ts'
import { bracketIncome, effectiveRate, taxOnBenefits } from '@/lib/annualFigures.ts'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { formatPesoWhole } from '@/lib/peso.ts'

/** With the 8% option next to a salary the card is about the pay alone, so even its 0% bracket has to say so. */
const PAY_ONLY = { caption: 'taxable pay (8% part taxed apart)', noTaxHeadline: 'No tax on your pay' }

/** The third figure: the tax on bonuses when there is pay, or which tax option the business income is on. */
function ThirdTile({ result }: { result: AnnualReturnResult }) {
  if (result.compensation) {
    return (
      <StatTile label="Bonus tax" value={formatPesoWhole(taxOnBenefits(result))} info={bonusTaxInfo(result.year)} />
    )
  }
  if (result.graduatedBusiness) {
    return (
      <StatTile label="Tax option" value="Graduated" info="The graduated rates on what is left after your deduction." />
    )
  }
  const reduction = formatPesoWhole(eightPercentRulesFor(result.year).reduction)
  return (
    <StatTile
      label="Tax option"
      value="8% flat"
      info={`8% of your receipts above ${reduction}, in place of the graduated rates and the percentage tax.`}
    />
  )
}

/** Three figures at a glance, then where the income sits in the tax table. Shows nothing until there is a result. */
export default function AnnualInsights({ outcome }: { outcome: AnnualOutcome }) {
  if (!outcome.ok) return null
  const { result } = outcome
  const income = bracketIncome(result)
  // The business income taxed at 8% is not part of what the brackets apply to.
  const payOnly = result.compensation !== null && (result.business?.base ?? 0) > 0

  return (
    <div className="space-y-4">
      <StatRow>
        <StatTile
          label="Annual tax"
          value={formatPesoWhole(result.totalTaxDue)}
          info="Your income tax for the whole year, on all the income counted here."
        />
        <StatTile
          label="Effective rate"
          value={`${(effectiveRate(result) * 100).toFixed(1)}%`}
          info="Your annual tax as a share of your pay and business income before deductions. Tax-free de minimis benefits are left out."
        />
        <ThirdTile result={result} />
      </StatRow>
      {/* The 8% option on its own has no brackets to place the income in. */}
      {income === null ? null : (
        <BracketCard taxableIncome={income} year={result.year} {...(payOnly ? PAY_ONLY : {})} />
      )}
    </div>
  )
}
