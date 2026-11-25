import type { Option } from '@/components/shared/SelectField.tsx'
import type { Recurrence } from '@/lib/yearForm.ts'

/** The choices for how often an amount repeats, for the dropdowns that pick a `Recurrence`. */
export const RECURRENCE_OPTIONS: Array<Option<Recurrence>> = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
]
