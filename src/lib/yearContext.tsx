import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { YearContext, type YearContextValue } from './useYear.ts'
import { initialForm, type FormState } from './yearForm.ts'

/** Holds the annual form for every section of the Annual page. It lives in memory only. */
export function YearProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => initialForm())
  // The actions never change, so a section can depend on them without running again for every keystroke.
  const update = useCallback((change: (current: FormState) => FormState) => setForm((current) => change(current)), [])
  const reset = useCallback(() => setForm(initialForm()), [])
  const value = useMemo<YearContextValue>(() => ({ form, update, reset }), [form, update, reset])
  return <YearContext.Provider value={value}>{children}</YearContext.Provider>
}
