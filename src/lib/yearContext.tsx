import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { YearContext, type YearContextValue } from './useYear.ts'
import { initialForm, type FormState } from './yearForm.ts'

/** Holds the annual form for every section of the Annual page. It lives in memory only. */
export function YearProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => initialForm())
  // The newest form, including changes React has not drawn yet. Each change builds on it, so changes made one
  // after the other in the same event both count, and an id handed out is never handed out again.
  const latest = useRef(form)
  const apply = useCallback((next: FormState) => {
    latest.current = next
    setForm(next)
  }, [])
  // The actions never change, so a section can depend on them without running again for every keystroke.
  const update = useCallback((change: (current: FormState) => FormState) => apply(change(latest.current)), [apply])
  const reset = useCallback(() => apply(initialForm()), [apply])
  const takeId = useCallback(() => {
    const id = latest.current.nextId
    apply({ ...latest.current, nextId: id + 1 })
    return id
  }, [apply])
  const value = useMemo<YearContextValue>(() => ({ form, update, reset, takeId }), [form, update, reset, takeId])
  return <YearContext.Provider value={value}>{children}</YearContext.Provider>
}
