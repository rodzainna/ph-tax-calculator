import { describe, expect, it } from 'vitest'
import {
  caretAfterFormat,
  countPesoChars,
  formatPeso,
  formatPesoInput,
  formatPesoWhole,
  formatRate,
  parsePeso,
  removedCharacter,
  splitPeso,
  wholeDigitCount,
} from './peso.ts'

describe('formatPesoInput (live commas while typing)', () => {
  it('stops taking whole-number digits at 12, so amounts stay exact', () => {
    expect(formatPesoInput('999999999999')).toBe('999,999,999,999')
    expect(formatPesoInput('9999999999999999')).toBe('999,999,999,999')
    expect(formatPesoInput('1234567890123.45')).toBe('123,456,789,012.45')
  })

  it('adds commas as the number grows', () => {
    expect(formatPesoInput('4')).toBe('4')
    expect(formatPesoInput('400')).toBe('400')
    expect(formatPesoInput('4000')).toBe('4,000')
    expect(formatPesoInput('40000')).toBe('40,000')
    expect(formatPesoInput('400000')).toBe('400,000')
    expect(formatPesoInput('4000000')).toBe('4,000,000')
    expect(formatPesoInput('1234567890')).toBe('1,234,567,890')
  })

  it('takes commas back out when digits are removed', () => {
    expect(formatPesoInput('4,00')).toBe('400')
    expect(formatPesoInput('1,2345')).toBe('12,345')
  })

  it('keeps decimals as typed, up to two', () => {
    expect(formatPesoInput('1234.')).toBe('1,234.')
    expect(formatPesoInput('1234.5')).toBe('1,234.5')
    expect(formatPesoInput('1234.50')).toBe('1,234.50')
    expect(formatPesoInput('1234.567')).toBe('1,234.56')
  })

  it('starts a lone dot with a zero', () => {
    expect(formatPesoInput('.')).toBe('0.')
    expect(formatPesoInput('.5')).toBe('0.5')
  })

  it('drops leading zeros but keeps a single zero', () => {
    expect(formatPesoInput('0')).toBe('0')
    expect(formatPesoInput('007')).toBe('7')
    expect(formatPesoInput('0.5')).toBe('0.5')
    expect(formatPesoInput('00.5')).toBe('0.5')
  })

  it('ignores a second dot and anything that is not a digit', () => {
    expect(formatPesoInput('1,234.5.')).toBe('1,234.5')
    expect(formatPesoInput('12a3')).toBe('123')
    expect(formatPesoInput('-500')).toBe('500')
    expect(formatPesoInput('₱ 1,234,567.891')).toBe('1,234,567.89')
  })

  it('leaves an empty field empty', () => {
    expect(formatPesoInput('')).toBe('')
    expect(formatPesoInput('abc')).toBe('')
  })

  it('always gives something parsePeso reads back as the same number', () => {
    for (const raw of ['400000', '1234.5', '0.05', '1234.', '', '9876543.21']) {
      expect(parsePeso(formatPesoInput(raw))).toBe(parsePeso(raw))
    }
    // A bare dot is not a number to parsePeso, but its formatted "0." is, and reads as zero.
    expect(parsePeso('.')).toBeNaN()
    expect(parsePeso(formatPesoInput('.'))).toBe(0)
  })
})

describe('keeping the cursor in place', () => {
  it('counts only digits and dots', () => {
    expect(countPesoChars('1,234.5')).toBe(6) // five digits and the dot
    expect(countPesoChars('')).toBe(0)
  })

  it('puts the cursor after the same digit once commas move', () => {
    // typed the 4th digit at the end of "400" -> "4000" is shown as "4,000", cursor at the end
    expect(caretAfterFormat('4,000', 4)).toBe(5)
    // cursor was after the first digit of "1234" (1|234); in "1,234" that is right after the 1
    expect(caretAfterFormat('1,234', 1)).toBe(1)
    // after the second digit (12|34) it is after the 2, past the comma
    expect(caretAfterFormat('1,234', 2)).toBe(3)
  })

  it('handles the start, the end and things that shrank', () => {
    expect(caretAfterFormat('1,234', 0)).toBe(0)
    expect(caretAfterFormat('1,234', 99)).toBe(5)
    expect(caretAfterFormat('', 3)).toBe(0)
  })
})

describe('splitPeso', () => {
  it('splits into sign, peso sign, whole number and cents', () => {
    expect(splitPeso(11730)).toEqual({ sign: '', symbol: '₱', whole: '11,730', fraction: '00' })
    expect(splitPeso(1234567.5)).toEqual({ sign: '', symbol: '₱', whole: '1,234,567', fraction: '50' })
    expect(splitPeso(0)).toEqual({ sign: '', symbol: '₱', whole: '0', fraction: '00' })
  })

  it('keeps the sign of a negative amount', () => {
    const p = splitPeso(-500.25)
    expect(p.whole).toBe('500')
    expect(p.fraction).toBe('25')
    expect(p.sign).not.toBe('')
  })

  it('puts back together as what formatPeso gives', () => {
    for (const n of [0, 5, 11730, 1234567.89, -42.1]) {
      const p = splitPeso(n)
      expect(`${p.sign}${p.symbol}${p.whole}.${p.fraction}`).toBe(formatPeso(n))
    }
  })
})

describe('formatRate', () => {
  it('writes a rate as a short percentage', () => {
    expect(formatRate(0.05)).toBe('5%')
    expect(formatRate(0.025)).toBe('2.5%')
    expect(formatRate(0.0175)).toBe('1.75%')
    expect(formatRate(0.045)).toBe('4.5%')
    expect(formatRate(0)).toBe('0%')
  })
})

describe('formatPesoWhole', () => {
  it('drops the centavos and rounds', () => {
    expect(formatPesoWhole(20_415)).toBe('₱20,415')
    expect(formatPesoWhole(450_150.4)).toBe('₱450,150')
    expect(formatPesoWhole(0.4)).toBe('₱0')
    expect(formatPesoWhole(1_234_567.89)).toBe('₱1,234,568')
  })
})

describe('wholeDigitCount and removedCharacter', () => {
  it('counts the whole-number digits, not the zeros in front or the decimals', () => {
    expect(wholeDigitCount('1,234.56')).toBe(4)
    expect(wholeDigitCount('0.5')).toBe(0)
    expect(wholeDigitCount('000123')).toBe(3)
    expect(wholeDigitCount('')).toBe(0)
  })

  it('finds the one character a deletion removed', () => {
    expect(removedCharacter('1,234', '1234')).toBe(',')
    expect(removedCharacter('0.5', '.5')).toBe('0')
    expect(removedCharacter('12', '1')).toBe('2')
  })

  it('is null when it was not a single deletion', () => {
    expect(removedCharacter('12', '12')).toBeNull()
    expect(removedCharacter('12', '9')).toBeNull()
    expect(removedCharacter('12', '123')).toBeNull()
  })
})
