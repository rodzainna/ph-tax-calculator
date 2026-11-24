import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  otherTheme,
  readSavedTheme,
  resolveTheme,
  saveTheme,
  systemPrefersDark,
  type Theme,
} from './theme.ts'

/** The current theme and a way to switch it. Follows the device until a choice is saved. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(readSavedTheme(), systemPrefersDark()))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // With no saved choice, a change on the device (sunset, a system setting) carries over.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readSavedTheme() === null) setTheme(query.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next = otherTheme(theme)
    saveTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
