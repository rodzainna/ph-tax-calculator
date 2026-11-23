import { describe, expect, it } from 'vitest'
import { otherTheme, parseTheme, resolveTheme } from './theme.ts'

describe('theme', () => {
  it('reads only light or dark from storage', () => {
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('system')).toBeNull()
    expect(parseTheme('')).toBeNull()
    expect(parseTheme(null)).toBeNull()
  })

  it('uses the saved choice over the device preference', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the device when nothing is saved', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
  })

  it('switches to the other one', () => {
    expect(otherTheme('dark')).toBe('light')
    expect(otherTheme('light')).toBe('dark')
  })
})
