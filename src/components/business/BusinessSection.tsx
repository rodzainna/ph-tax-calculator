import { Briefcase } from 'lucide-react'
import ExpenseList from '@/components/business/ExpenseList.tsx'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import DateRangeFields from '@/components/shared/DateRangeFields.tsx'
import MoreTray from '@/components/shared/MoreTray.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import { RECURRENCE_OPTIONS } from '@/components/shared/recurrenceOptions.ts'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fieldSetter } from '@/lib/fieldSetter.ts'
import type { TaxMethod } from '@/lib/taxpayer.ts'
import type { BusinessDeductionChoice, BusinessState } from '@/lib/yearForm.ts'

interface Props {
  business: BusinessState
  /** The tax option picked at the top. */
  method: TaxMethod
  /** The tax year. A blank start date means January 1 of it. */
  year: number
  /** The date the figures are counted to. The end date starts here when the income stops. */
  asOf: string
  onChange: (next: BusinessState) => void
  nextLineId: () => number
  /** Graduated + itemized: how the expenses compare with the 40% standard deduction. */
  deductionHint?: string
}

const DEDUCTION_OPTIONS: Array<Option<BusinessDeductionChoice>> = [
  { value: 'osd', label: '40% standard deduction' },
  { value: 'itemized', label: 'Itemized expenses' },
]

const METHOD_LABEL: Record<TaxMethod, string> = { graduated: 'Graduated rates', 'eight-percent': '8% option' }

/** Business or freelance income, for the self-employed and mixed: how much, how often, the dates and the deduction. */
export default function BusinessSection({ business, method, year, asOf, onChange, nextLineId, deductionHint }: Props) {
  const set = fieldSetter(business, onChange)

  return (
    // Built like the employer card: the accent bar, a 40px badge and an 18px title, as tall as the summary beside it.
    <SoftCard accent className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            aria-hidden
          >
            <Briefcase className="size-5" />
          </span>
          <CardTitle className="text-lg group-data-[size=sm]/card:text-lg">Business or freelance</CardTitle>
        </div>
        <Badge variant="secondary">{METHOD_LABEL[method]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <PesoInput label="Amount" value={business.amount} onChange={set('amount')} emphasis="soft" />
          <SelectField
            id="business-frequency"
            label="Received"
            value={business.frequency}
            onChange={set('frequency')}
            options={RECURRENCE_OPTIONS}
          />
          <DateRangeFields
            idSuffix="business"
            year={year}
            asOf={asOf}
            startDate={business.startDate}
            endDate={business.endDate}
            onChange={(patch) => onChange({ ...business, ...patch })}
            openEndedLabel="Still receiving"
          />
        </div>

        {method === 'graduated' ? (
          <div className="space-y-3">
            <SelectField
              id="business-deduction"
              label="Deduction"
              value={business.deduction}
              onChange={set('deduction')}
              options={DEDUCTION_OPTIONS}
              className="w-56"
            />
            {business.deduction === 'itemized' ? (
              <div className="space-y-2">
                <ExpenseList lines={business.expenses} onChange={set('expenses')} nextLineId={nextLineId} />
                {deductionHint ? <p className="text-xs text-muted-foreground">{deductionHint}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <MoreTray contentClassName="grid gap-3 space-y-0 sm:grid-cols-2">
          <PesoInput label="Other income" value={business.otherIncome} onChange={set('otherIncome')} />
          <PesoInput label="1701Q paid" value={business.quarterlyPaid} onChange={set('quarterlyPaid')} />
          <PesoInput label="Withheld (2307)" value={business.credit2307} onChange={set('credit2307')} />
        </MoreTray>
      </CardContent>
    </SoftCard>
  )
}
