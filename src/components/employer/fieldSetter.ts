import type { EmployerState } from '@/lib/yearForm.ts'

/** `set('basic')` gives the function that saves a new `basic`, keeping the rest of the employer as it is. */
export function fieldSetter(employer: EmployerState, onChange: (next: EmployerState) => void) {
  return <K extends keyof EmployerState>(key: K) =>
    (value: EmployerState[K]) =>
      onChange({ ...employer, [key]: value })
}
