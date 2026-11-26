import type { CalcKey } from './calc.ts'

/** Keyboard keys that are written the same on the calculator. */
const isSameKey = (key: string): key is CalcKey => /^[0-9.%+]$/.test(key)

/** Keyboard keys that stand for a calculator key. */
const OTHER_KEYS = new Map<string, CalcKey>([
  ['-', '−'],
  ['*', '×'],
  ['x', '×'],
  ['X', '×'],
  ['/', '÷'],
  ['=', '='],
  ['Enter', '='],
  ['Backspace', '⌫'],
  ['Delete', 'C'],
  ['c', 'C'],
  ['C', 'C'],
])

interface KeyPress {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

/** The calculator key for a keyboard press, or null to leave the press to the browser, as with shortcuts. */
export function calcKeyFor({ key, ctrlKey, metaKey, altKey }: KeyPress): CalcKey | null {
  if (ctrlKey || metaKey || altKey) return null
  return isSameKey(key) ? key : (OTHER_KEYS.get(key) ?? null)
}
