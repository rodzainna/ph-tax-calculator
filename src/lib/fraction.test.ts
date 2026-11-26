import { describe, expect, it } from 'vitest'
import { add, divide, multiply, parseDecimal, subtract, toDecimalText, type Fraction } from './fraction.ts'

const of = parseDecimal
const text = (value: Fraction | null, maxDigits = 15) => (value === null ? null : toDecimalText(value, maxDigits))
const quotient = (a: string, b: string, maxDigits = 15) => text(divide(of(a), of(b)), maxDigits)

describe('parseDecimal', () => {
  it('reads decimals in lowest terms', () => {
    expect(of('12.50')).toEqual({ num: 25n, den: 2n })
    expect(of('-0.25')).toEqual({ num: -1n, den: 4n })
    expect(of('007')).toEqual({ num: 7n, den: 1n })
  })

  it('reads a number that is still being typed', () => {
    expect(of('12.')).toEqual({ num: 12n, den: 1n })
    expect(of('-0')).toEqual({ num: 0n, den: 1n })
    expect(of('-0.0')).toEqual({ num: 0n, den: 1n })
  })
})

describe('arithmetic', () => {
  it('is exact', () => {
    expect(text(add(of('0.1'), of('0.2')))).toBe('0.3')
    expect(text(subtract(of('1000000.1'), of('1000000')))).toBe('0.1')
    expect(text(multiply(of('1.1'), of('3')))).toBe('3.3')
    const third = divide(of('1'), of('3'))!
    expect(multiply(third, of('3'))).toEqual({ num: 1n, den: 1n })
  })

  it('keeps the sign on the top, whichever side was negative', () => {
    expect(divide(of('1'), of('-4'))).toEqual({ num: -1n, den: 4n })
    expect(divide(of('-1'), of('-4'))).toEqual({ num: 1n, den: 4n })
    expect(divide(of('0'), of('-4'))).toEqual({ num: 0n, den: 1n })
  })

  it('gives null for a division by zero', () => {
    expect(divide(of('5'), of('0'))).toBeNull()
    expect(divide(of('0'), of('-0.0'))).toBeNull()
  })

  it('stays small over a long sum', () => {
    let total = of('0')
    for (let i = 0; i < 1000; i++) total = add(total, of('0.01'))
    expect(total).toEqual({ num: 10n, den: 1n })
  })
})

describe('toDecimalText', () => {
  it('has no trailing zeros and no exponent form', () => {
    expect(text(of('100'))).toBe('100')
    expect(text(of('1.500'))).toBe('1.5')
    expect(quotient('1', '10000000000')).toBe('0.0000000001')
  })

  it('rounds the last digit that fits, halves away from zero', () => {
    expect(text(of('1.25'), 2)).toBe('1.3')
    expect(text(of('-1.25'), 2)).toBe('-1.3')
    expect(text(of('1.249'), 2)).toBe('1.2')
    expect(quotient('2', '3', 5)).toBe('0.6667')
  })

  it('carries a round-up into the whole part', () => {
    expect(text(of('9.999'), 3)).toBe('10')
    expect(text(of('0.999'), 3)).toBe('1')
    expect(text(of('-99.95'), 3)).toBe('-100')
  })

  it('never writes -0', () => {
    expect(text(of('-0.001'), 3)).toBe('0')
    expect(text(of('-0.005'), 3)).toBe('-0.01')
  })

  it('is null when the whole part does not fit', () => {
    expect(text(of('999'), 3)).toBe('999')
    expect(text(of('1000'), 3)).toBeNull()
    expect(text(of('-1000'), 3)).toBeNull()
    expect(text(of('999.5'), 3)).toBeNull()
    expect(text(of('999.4'), 3)).toBe('999')
  })
})
