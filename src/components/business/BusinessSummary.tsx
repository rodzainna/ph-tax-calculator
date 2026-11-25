import { useId } from 'react'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import MoneyRow from '@/components/shared/MoneyRow.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import type { TaxMethod } from '@/lib/taxpayer.ts'
import type { BusinessState } from '@/lib/yearForm.ts'

const RECEIPTS_HINT = 'What you received for the year, before any tax your clients withheld.'

interface Props {
  method: TaxMethod
  business: BusinessState
  /** The worked-out estimate, when there is one. */
  result?: AnnualReturnResult
  onQuarterlyPaidChange: (value: string) => void
  onCredit2307Change: (value: string) => void
}

/** The 8% option: receipts, the reduction, what is left to tax, and the tax. */
function EightPercentFigures({ figures }: { figures: AnnualReturnResult['business'] | undefined }) {
  return (
    <>
      <dl>
        <MoneyRow strong label="Receipts and other income" amount={figures?.base ?? null} hint={RECEIPTS_HINT} />
      </dl>
      <dl className="space-y-1.5 border-t pt-2.5">
        <MoneyRow
          label="Reduction"
          amount={figures?.reduction ?? null}
          sign="minus"
          hint="Up to ₱250,000 off, for the self-employed only. There is none when you also earn a salary."
        />
        <MoneyRow subtotal label="Taxable amount" amount={figures?.taxableBase ?? null} />
        <MoneyRow strong label="Tax at 8%" amount={figures?.tax ?? null} />
      </dl>
    </>
  )
}

/** Graduated rates: receipts, the deduction, other income, and the net income the rates are applied to. */
function GraduatedFigures({ figures }: { figures: AnnualReturnResult['graduatedBusiness'] | undefined }) {
  return (
    <>
      <dl>
        <MoneyRow strong label="Gross receipts" amount={figures?.grossReceipts ?? null} hint={RECEIPTS_HINT} />
      </dl>
      <dl className="space-y-1.5 border-t pt-2.5">
        <MoneyRow
          label={figures?.deductionKind === 'itemized' ? 'Itemized expenses' : '40% deduction'}
          amount={figures?.deduction ?? null}
          sign="minus"
        />
        {figures && figures.otherNonOperatingIncome > 0 ? (
          <MoneyRow label="Other income" amount={figures.otherNonOperatingIncome} sign="plus" />
        ) : null}
        <MoneyRow subtotal label="Net income" amount={figures?.netBusinessIncome ?? null} />
      </dl>
    </>
  )
}

/** A small summary beside the business card, like the one beside each employer: the figures for the business income. */
export default function BusinessSummary({
  method,
  business,
  result,
  onQuarterlyPaidChange,
  onCredit2307Change,
}: Props) {
  const titleId = useId()

  return (
    // Named by its title, like the employer summary. Same header too: a 40px row, so the two line up.
    <SoftCard accent className="h-full" role="group" aria-labelledby={titleId}>
      <CardHeader className="flex min-h-10 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle id={titleId}>Summary Business</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {method === 'eight-percent' ? (
            <EightPercentFigures figures={result?.business} />
          ) : (
            <GraduatedFigures figures={result?.graduatedBusiness} />
          )}
        </div>
        {/* The same values as 1701Q paid and Withheld (2307) in the business card, so either place can change them. */}
        <div className="mt-2.5 space-y-2.5 border-t pt-2.5">
          <PesoInput
            compact
            label="Tax paid"
            value={business.quarterlyPaid}
            onChange={onQuarterlyPaidChange}
            info="Quarterly tax you paid (1701Q)."
          />
          <PesoInput
            compact
            label="Tax withheld"
            value={business.credit2307}
            onChange={onCredit2307Change}
            info="Withheld by your clients, with a 2307."
          />
        </div>
      </CardContent>
    </SoftCard>
  )
}
