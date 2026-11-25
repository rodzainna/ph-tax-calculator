import { act } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * A stand-in for the screen width, which jsdom does not have: only `wideQuery` matches, and only after widening.
 * Undo it with `vi.unstubAllGlobals()`.
 */
export function fakeScreen(wideQuery = '(min-width: 80rem)') {
  const listeners = new Set<() => void>()
  let wide = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return wide && query === wideQuery
    },
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  }))
  return {
    listeners,
    resize(toWide: boolean) {
      wide = toWide
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}
