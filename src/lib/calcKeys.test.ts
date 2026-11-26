import { describe, expect, it } from 'vitest'
import { calcKeyFor } from './calcKeys.ts'

const pressed = (key: string, held: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) =>
  calcKeyFor({ key, ctrlKey: false, metaKey: false, altKey: false, ...held })

describe('calcKeyFor', () => {
  it('takes digits, the dot, % and +', () => {
    for (const key of '0123456789.%+') expect(pressed(key)).toBe(key)
  })

  it.each([
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
  ])('reads %s as %s', (keyboard, calculator) => {
    expect(pressed(keyboard)).toBe(calculator)
  })

  it('ignores other keys', () => {
    for (const key of ['a', ' ', 'Tab', 'Escape', 'Shift', 'ArrowLeft', 'F5', ',', '12', 'toString', '__proto__']) {
      expect(pressed(key), key).toBeNull()
    }
  })

  it('leaves shortcuts such as copy and paste to the browser', () => {
    for (const held of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      expect(pressed('c', held)).toBeNull()
      expect(pressed('v', held)).toBeNull()
      expect(pressed('-', held)).toBeNull()
    }
  })
})
