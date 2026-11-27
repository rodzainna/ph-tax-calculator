import { Trash2 } from 'lucide-react'
import EmployerPayslipFields from '@/components/employer/EmployerPayslipFields.tsx'
import EmployerSalaryDetails from '@/components/employer/EmployerSalaryDetails.tsx'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import CardHeading from '@/components/shared/CardHeading.tsx'
import DateRangeFields from '@/components/shared/DateRangeFields.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import SegmentedControl, { type SegmentOption } from '@/components/shared/SegmentedControl.tsx'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import type { PayFrequency } from '@/engine/pay.ts'
import { withPayFrequency, type EarningsMode, type EmployerState } from '@/lib/yearForm.ts'
import { fieldSetter } from '@/lib/fieldSetter.ts'

interface Props {
  employer: EmployerState
  /** The tax year. A blank start date means January 1 of it. */
  year: number
  /** The date the figures are counted to. The end date starts here when someone stops working. */
  asOf: string
  index: number
  canRemove: boolean
  /** Hands out the id for a new benefit row. */
  nextLineId: () => number
  onChange: (next: EmployerState) => void
  onRemove: () => void
}

const MODE_OPTIONS: Array<SegmentOption<EarningsMode>> = [
  { value: 'rate', label: 'Salary' },
  { value: 'ytd', label: 'Payslip to date' },
]

const FREQUENCY_OPTIONS: Array<Option<PayFrequency>> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'semi-monthly', label: 'Twice a month' },
  { value: 'yearly', label: 'Yearly' },
]

/** One job: how the pay is entered, when you worked there, and the details for that way of entering it. */
export default function EmployerSection({
  employer,
  year,
  asOf,
  index,
  canRemove,
  nextLineId,
  onChange,
  onRemove,
}: Props) {
  const set = fieldSetter(employer, onChange)
  const payslipMode = employer.mode === 'ytd'

  return (
    <SoftCard accent className="h-full">
      <CardHeading
        badge={index + 1}
        title={`Employer #${index + 1}`}
        action={
          canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`Remove employer #${index + 1}`}
            >
              <Trash2 /> Remove
            </Button>
          ) : null
        }
      />

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <SegmentedControl
            label="How to enter your pay"
            value={employer.mode}
            onChange={set('mode')}
            options={MODE_OPTIONS}
          />
        </div>

        {payslipMode ? null : (
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <PesoInput label="Basic salary" value={employer.basic} onChange={set('basic')} emphasis="soft" />
            <SelectField
              id={`freq-${employer.id}`}
              label="Paid"
              value={employer.frequency}
              onChange={(frequency) => onChange(withPayFrequency(employer, frequency))}
              options={FREQUENCY_OPTIONS}
            />
          </div>
        )}

        <div className="grid items-end gap-3 sm:grid-cols-2">
          <DateRangeFields
            idSuffix={employer.id}
            year={year}
            asOf={asOf}
            startDate={employer.startDate}
            endDate={employer.endDate}
            onChange={(patch) => onChange({ ...employer, ...patch })}
            openEndedLabel="Still working"
          />
        </div>

        {payslipMode ? (
          <EmployerPayslipFields employer={employer} onChange={onChange} />
        ) : (
          <EmployerSalaryDetails employer={employer} nextLineId={nextLineId} onChange={onChange} />
        )}
      </CardContent>
    </SoftCard>
  )
}
