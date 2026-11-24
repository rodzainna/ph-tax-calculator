import { createContext, useContext } from 'react'
import type { FormState } from './yearForm.ts'

export interface YearContextValue {
  form: FormState
  /** Updates the shared annual form. Everything stays in memory; nothing is stored or sent. */
  update: (change: (current: FormState) => FormState) => void
  reset: () => void
}

export const YearContext = createContext<YearContextValue | null>(null)

export function useYear(): YearContextValue {
  const context = useContext(YearContext)
  if (!context) throw new Error('useYear must be used inside YearProvider')
  return context
}
