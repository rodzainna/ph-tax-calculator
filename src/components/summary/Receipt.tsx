import { ReceiptRule } from '@/components/shared/AppCard.tsx'
import MoneyRow from '@/components/shared/MoneyRow.tsx'
import BalanceRow from '@/components/summary/BalanceRow.tsx'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import { eightPercentRulesFor } from '@/engine/eightPercentTax.ts'
import { deductions, grossIncome, taxableIncome } from '@/lib/annualFigures.ts'
import { formatPeso } from '@/lib/peso.ts'

const CREDITS_HINT =
  'Tax you have already paid or had withheld: by your employers, on your quarterly returns (1701Q) and on your 2307s. It is taken off what you owe.'

/** What came in: pay and benefits, business receipts, and the gross income they add up to. */
function IncomeRows({ result }: { result: AnnualReturnResult }) {
  const { compensation: comp, business: eight, graduatedBusiness: grad } = result
  return (
    <dl className="space-y-2">
      {comp ? (
        <>
          <MoneyRow label="Regular pay" amount={comp.totalRegularPay} />
          <MoneyRow
            label="13th month and bonuses"
            amount={comp.benefitsPool}
            hint={`13th month pay, bonuses and other benefits. The first ${formatPeso(comp.benefitsCeiling)} is exempt from tax, shared across all your employers.`}
          />
        </>
      ) : null}
      {eight ? (
        <MoneyRow
          label="Total receipts"
          amount={eight.base}
          hint="What you received for the year plus any other income, before any tax your clients withheld."
        />
      ) : null}
      {grad ? (
        <>
          <MoneyRow
            label="Gross receipts"
            amount={grad.grossReceipts}
            hint="Everything you received for the year, before any tax your clients withheld."
          />
          {grad.otherNonOperatingIncome > 0 ? (
            <MoneyRow
              label="Other income"
              amount={grad.otherNonOperatingIncome}
              sign="plus"
              hint="Other income of the business, such as interest. The standard deduction does not apply to it."
            />
          ) : null}
        </>
      ) : null}
      <MoneyRow strong label={comp && !eight && !grad ? 'Gross pay' : 'Gross income'} amount={grossIncome(result)} />
    </dl>
  )
}

/** What comes off, in red: contributions, the exempt 13th month, and the business deduction or reduction. */
function DeductionRows({ result }: { result: AnnualReturnResult }) {
  const { compensation: comp, business: eight, graduatedBusiness: grad } = result
  const d = deductions(result)
  return (
    <dl className="space-y-2">
      {comp ? (
        <MoneyRow
          tone="deduction"
          label="SSS, PhilHealth, Pag-IBIG"
          amount={d.contributions}
          sign="minus"
          hint="Your share of the mandatory contributions. They come off your pay before tax is worked out."
        />
      ) : null}
      {comp && comp.benefitsPool > 0 ? (
        <MoneyRow
          tone="deduction"
          label="Exempt 13th month"
          amount={d.exemptBenefits}
          sign="minus"
          hint={`The part of your 13th month and bonuses that is not taxed: the first ${formatPeso(comp.benefitsCeiling)}, shared across all your employers.`}
        />
      ) : null}
      {eight ? (
        <MoneyRow
          tone="deduction"
          label="Reduction"
          amount={d.business}
          sign="minus"
          hint={`The first ${formatPeso(eightPercentRulesFor(result.year).reduction)} is not taxed under the 8% option.${eight.reduction === 0 && comp ? ' It is not allowed when you also earn a salary.' : ''}`}
        />
      ) : null}
      {grad ? (
        <MoneyRow
          tone="deduction"
          label={grad.deductionKind === 'itemized' ? 'Itemized expenses' : '40% deduction'}
          amount={d.business}
          sign="minus"
          hint={
            grad.deductionKind === 'itemized'
              ? 'The business expenses you listed. You need receipts and books to support them.'
              : 'A flat 40% of your gross receipts, in place of listing your actual expenses.'
          }
        />
      ) : null}
      <MoneyRow strong tone="deduction" label="Total deductions" amount={d.total} sign="minus" />
    </dl>
  )
}

/** What the tax is worked out on, and the tax itself. */
function TaxRows({ result }: { result: AnnualReturnResult }) {
  const { compensation: comp, business: eight, graduatedBusiness: grad } = result
  return (
    <dl className="space-y-2">
      <MoneyRow
        strong
        label="Taxable income"
        amount={taxableIncome(result)}
        hint={
          grad && comp
            ? 'Your taxable pay plus your net business income. The graduated rates are applied once to this total.'
            : 'Gross income minus the deductions above: what the tax is worked out on.'
        }
      />
      {comp && eight ? (
        <>
          <MoneyRow
            label="Tax on pay"
            amount={comp.taxDue}
            hint="Income tax on your taxable pay, using the graduated rates for the year."
          />
          <MoneyRow
            label="Tax at 8%"
            amount={eight.tax}
            hint="8% of your receipts above the reduction, in place of the graduated rates and the percentage tax."
          />
        </>
      ) : null}
      <MoneyRow strong label="Total income tax" amount={result.totalTaxDue} />
    </dl>
  )
}

/**
 * What has already been paid: withheld by employers, quarterly payments and 2307s, and the credits they add up to.
 * The credits are rounded to a whole peso, as on the BIR form, so with centavos typed in they can differ from the
 * rows above by under a peso.
 */
function CreditRows({ result }: { result: AnnualReturnResult }) {
  const { compensation: comp } = result
  const business = result.business ?? result.graduatedBusiness
  return (
    <dl className="space-y-2">
      {comp ? (
        <MoneyRow
          label="Withheld by employers"
          amount={comp.totalTaxWithheld}
          hint="Tax your employers withheld from your pay. If you are partway through the year, this is projected to Dec 31 at the same pace."
        />
      ) : null}
      {business ? (
        <>
          <MoneyRow
            label="Quarterly tax paid"
            amount={business.quarterlyTaxPaid}
            hint="Income tax you already paid on your quarterly returns (BIR Form 1701Q)."
          />
          <MoneyRow
            label="Withheld, with a 2307"
            amount={business.creditableWithholding}
            hint="Tax your clients withheld from your payments, shown on a BIR Form 2307 they give you."
          />
        </>
      ) : null}
      <MoneyRow strong label="Credits" amount={result.totalCredits} sign="minus" hint={CREDITS_HINT} />
    </dl>
  )
}

/** The year's estimate as a payslip: income, deductions (red), tax, credits, then what is left to pay. */
export default function Receipt({ result }: { result: AnnualReturnResult }) {
  return (
    <div className="space-y-4">
      <IncomeRows result={result} />
      <ReceiptRule />
      <DeductionRows result={result} />
      <ReceiptRule />
      <TaxRows result={result} />
      <ReceiptRule />
      <CreditRows result={result} />
      <BalanceRow balance={result.balance} />
    </div>
  )
}
