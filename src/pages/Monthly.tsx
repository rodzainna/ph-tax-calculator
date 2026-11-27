import { useMemo, useState } from 'react'
import EmployeeFields from '@/components/monthly/EmployeeFields.tsx'
import PayCard from '@/components/monthly/PayCard.tsx'
import PayslipCard from '@/components/monthly/PayslipCard.tsx'
import ResultInsights from '@/components/monthly/ResultInsights.tsx'
import SelfEmployedFields from '@/components/monthly/SelfEmployedFields.tsx'
import { PAYSLIP_ID } from '@/components/monthly/payslipView.ts'
import TaxpayerFields from '@/components/shared/TaxpayerFields.tsx'
import { CONTRIBUTIONS_FIRST_YEAR } from '@/engine/rules/contributions.ts'
import { initialMonthlyForm, monthlyOutcome, type MonthlyForm } from '@/lib/monthlyOutcome.ts'
import { isSelfEmployed } from '@/lib/taxpayer.ts'
import { capTaxYear, taxYearsFrom } from '@/lib/taxYears.ts'

const YEARS = taxYearsFrom(CONTRIBUTIONS_FIRST_YEAR)
/** Skip on touch screens, where it would pop up the keyboard and cover the page. */
const AUTOFOCUS = typeof window !== 'undefined' && !window.matchMedia?.('(pointer: coarse)')?.matches

export default function Monthly() {
  const [form, setForm] = useState(() => initialMonthlyForm(capTaxYear(new Date().getFullYear())))

  const change = (patch: Partial<MonthlyForm>) =>
    setForm((current) => {
      const next = { ...current, ...patch }
      // Typing the same as the salary goes back to following it.
      if (patch.bonus !== undefined && patch.bonus === next.basic) next.bonus = null
      return next
    })

  const selfEmployed = isSelfEmployed(form.taxpayer)
  const outcome = useMemo(() => monthlyOutcome({ ...form, bonus: form.bonus ?? form.basic }), [form])

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <h1 className="sr-only">Monthly</h1>
      <TaxpayerFields
        idPrefix="monthly"
        year={form.year}
        years={YEARS}
        onYearChange={(year) => change({ year })}
        taxpayer={form.taxpayer}
        onTaxpayerChange={(taxpayer) => change({ taxpayer })}
      />

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <PayCard
          isSelfEmployed={selfEmployed}
          basic={form.basic}
          onBasicChange={(basic) => change({ basic })}
          autoFocus={AUTOFOCUS}
        >
          {selfEmployed ? (
            <SelfEmployedFields values={form} onChange={change} />
          ) : (
            <EmployeeFields year={form.year} values={{ ...form, bonus: form.bonus ?? form.basic }} onChange={change} />
          )}
        </PayCard>

        <div id={PAYSLIP_ID} className="scroll-mt-32 space-y-4">
          <PayslipCard year={form.year} outcome={outcome} taxpayer={form.taxpayer} minimumWage={form.minimumWage} />
          {outcome.ok ? <ResultInsights result={outcome.result} year={form.year} taxpayer={form.taxpayer} /> : null}
        </div>
      </div>
    </div>
  )
}
