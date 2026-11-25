import { createContext, useContext } from 'react'
import type { FormState } from './yearForm.ts'

export interface YearContextValue {
  form: FormState
  /**
   * Updates the shared annual form. Everything stays in memory; nothing is stored or sent.
   * `change` must be pure. Call this from an event handler, not while rendering.
   */
  update: (change: (current: FormState) => FormState) => void
  reset: () => void
  /** The next free id for a row. Each call gives a new one, even when called twice before the page is drawn again. */
  takeId: () => number
}

export const YearContext = createContext<YearContextValue | null>(null)

export function useYear(): YearContextValue {
  const context = useContext(YearContext)
  if (!context) throw new Error('useYear must be used inside YearProvider')
  return context
}
