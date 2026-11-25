import { Plus } from 'lucide-react'
import { Fragment, useMemo, useRef } from 'react'
import BusinessSection from '@/components/business/BusinessSection.tsx'
import BusinessSummary from '@/components/business/BusinessSummary.tsx'
import EmployerSection from '@/components/employer/EmployerSection.tsx'
import EmployerSummary from '@/components/employer/EmployerSummary.tsx'
import AnnualInsights from '@/components/insights/AnnualInsights.tsx'
import { ReceiptCard } from '@/components/shared/AppCard.tsx'
import TaxpayerFields from '@/components/shared/TaxpayerFields.tsx'
import MobileSummaryBar from '@/components/summary/MobileSummaryBar.tsx'
import SummaryBody from '@/components/summary/SummaryBody.tsx'
import { Button } from '@/components/ui/button'
import { computeScenario } from '@/lib/computeScenario.ts'
import { taxYearsFrom } from '@/lib/taxYears.ts'
import { usesBusiness, usesEmployers } from '@/lib/taxpayer.ts'
import { useYear } from '@/lib/useYear.ts'
import { YearProvider } from '@/lib/yearContext.tsx'
import { newEmployer, withTaxpayer, withYear, yearEndScenario } from '@/lib/yearForm.ts'

const YEARS = taxYearsFrom(2018)

/** The estimate counts pay and business income to the end of the year. */
const ASSUMPTION = 'Until Dec 31'

/** A card and the summary beside it. */
const CARD_AND_SUMMARY = 'grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]'

/** The Annual page so far: the employer and business cards with their summaries, the estimate and its insights. */
function Inner() {
  const { form, update, takeId } = useYear()
  const outcome = useMemo(() => computeScenario(form, yearEndScenario(form.year)), [form])
  const details = outcome.ok ? outcome.details : []
  const showEmployers = usesEmployers(form.taxpayer)
  const showBusiness = usesBusiness(form.taxpayer)
  const sideColumn = useRef<HTMLElement>(null)

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Annual</h1>
      <TaxpayerFields
        idPrefix="tax"
        types={['employee', 'self-employed', 'mixed']}
        year={form.year}
        years={YEARS}
        onYearChange={(year) => update((f) => withYear(f, year))}
        taxpayer={form.taxpayer}
        onTaxpayerChange={(taxpayer) => update((f) => withTaxpayer(f, taxpayer))}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {showEmployers ? (
            <>
              {form.employers.map((employer, index) => (
                <Fragment key={employer.id}>
                  {index > 0 ? (
                    <hr className="my-7 h-px border-0 bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
                  ) : null}
                  <div className={CARD_AND_SUMMARY}>
                    <EmployerSection
                      employer={employer}
                      year={form.year}
                      asOf={form.asOf}
                      index={index}
                      canRemove={form.employers.length > 1}
                      nextLineId={takeId}
                      onChange={(next) =>
                        update((f) => ({ ...f, employers: f.employers.map((e) => (e.id === next.id ? next : e)) }))
                      }
                      onRemove={() =>
                        update((f) => ({ ...f, employers: f.employers.filter((e) => e.id !== employer.id) }))
                      }
                    />
                    <EmployerSummary
                      index={index}
                      detail={details[index]}
                      employer={employer}
                      onTaxWithheldChange={(taxWithheld) =>
                        update((f) => ({
                          ...f,
                          employers: f.employers.map((e) => (e.id === employer.id ? { ...e, taxWithheld } : e)),
                        }))
                      }
                    />
                  </div>
                </Fragment>
              ))}
              <Button
                type="button"
                variant="outline"
                className="border-primary/30 bg-card text-primary shadow-sm hover:bg-accent hover:text-primary"
                onClick={() =>
                  update((f) => ({
                    ...f,
                    employers: [...f.employers, newEmployer(f.nextId, f.nextId + 1)],
                    nextId: f.nextId + 2,
                  }))
                }
              >
                <Plus /> Add another employer
              </Button>
            </>
          ) : null}

          {showBusiness ? (
            <div className={CARD_AND_SUMMARY}>
              <BusinessSection
                business={form.business}
                method={form.taxpayer.method}
                year={form.year}
                asOf={form.asOf}
                nextLineId={takeId}
                onChange={(business) => update((f) => ({ ...f, business }))}
              />
              <BusinessSummary
                method={form.taxpayer.method}
                business={form.business}
                result={outcome.ok ? outcome.result : undefined}
                onQuarterlyPaidChange={(quarterlyPaid) =>
                  update((f) => ({ ...f, business: { ...f.business, quarterlyPaid } }))
                }
                onCredit2307Change={(credit2307) => update((f) => ({ ...f, business: { ...f.business, credit2307 } }))}
              />
            </div>
          ) : null}
        </div>

        {/* Not sticky: this column can be taller than the screen. Narrower screens get the bar at the bottom. */}
        {/* Focusable from code only: it takes the focus when the screen widens while the bar's details are open. */}
        <aside ref={sideColumn} tabIndex={-1} aria-label="Your estimate" className="hidden xl:block xl:self-start">
          <ReceiptCard>
            <SummaryBody outcome={outcome} assumption={ASSUMPTION} />
          </ReceiptCard>
          <AnnualInsights outcome={outcome} />
        </aside>
      </div>
      <MobileSummaryBar outcome={outcome} assumption={ASSUMPTION} sideColumn={sideColumn} />
    </div>
  )
}

export default function AnnualPreview() {
  return (
    <YearProvider>
      <Inner />
    </YearProvider>
  )
}
