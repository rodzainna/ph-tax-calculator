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
        <div key={key} className="grid grid-cols-[1fr_8.5rem] items-end gap-3">
          <PesoInput
            label={label}
            value={value[key].amount}
            onChange={(amount) => onChange({ ...value, [key]: { ...value[key], amount } })}
          />
          <SelectField
            ariaLabel={`${label}: how often`}
            value={value[key].per}
            onChange={(per) => onChange({ ...value, [key]: { ...value[key], per } })}
            options={PER_OPTIONS}
          />
        </div>
      ))}
    </div>
  )
}
