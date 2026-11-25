import PesoInput from '@/components/shared/PesoInput.tsx'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import type { ContributionPer, EmployerState } from '@/lib/yearForm.ts'

type Custom = EmployerState['customContributions']

const FIELDS = [
  ['sss', 'SSS'],
  ['philhealth', 'PhilHealth'],
  ['pagibig', 'Pag-IBIG'],
] as const

const PER_OPTIONS: Array<Option<ContributionPer>> = [
  { value: 'month', label: 'Monthly' },
  { value: 'twice', label: 'Twice a month' },
  { value: 'overall', label: 'Total so far' },
]

/** SSS, PhilHealth and Pag-IBIG typed by hand, each as a monthly, twice-a-month or total amount. */
export default function CustomContributions({ value, onChange }: { value: Custom; onChange: (next: Custom) => void }) {
  return (
    <div className="space-y-2">
      {FIELDS.map(([key, label]) => (
        // How often moves under the amount when the two don't fit side by side. Side by side, which takes 20.25rem
        // (both widths and the gap), it drops by a label's height to sit level with the amount.
        <div key={key} className="@container">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
            <div className="flex-[999_1_11rem]">
              <PesoInput
                label={label}
                value={value[key].amount}
                onChange={(amount) => onChange({ ...value, [key]: { ...value[key], amount } })}
              />
            </div>
            <SelectField
              ariaLabel={`${label}: how often`}
              value={value[key].per}
              onChange={(per) => onChange({ ...value, [key]: { ...value[key], per } })}
              options={PER_OPTIONS}
              wrapperClassName="flex-[1_0_8.5rem] @min-[20.25rem]:mt-4.5"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
