import { describe, expect, it } from 'vitest'
import {
  expressionText,
  formatDisplay,
  initialCalc,
  pasteAmount,
  pendingOperator,
  press,
  screenText,
  type CalcKey,
} from './calc.ts'

/** '12 + 3.5 =' as the keys 1 2 + 3 . 5 = */
const keys = (text: string) =>
  text
    .split(' ')
    .filter(Boolean)
    .flatMap((token) => (/^[\d.]+$/.test(token) ? token.split('') : [token])) as CalcKey[]

const play = (text: string) => keys(text).reduce(press, initialCalc())

/** What is on the screen after those keys. */
const run = (text: string) => {
  const state = play(text)
  return state.error ?? screenText(state)
}

/** The running line above the screen. */
const line = (text: string) => expressionText(play(text))

const LARGEST = '999999999999999'

describe('typing', () => {
  it('types numbers', () => {
    expect(run('1204')).toBe('1204')
    expect(run('007')).toBe('7')
    expect(run('.5')).toBe('0.5')
    expect(run('1.2.3')).toBe('1.23')
  })

  it('stops at 15 digits', () => {
    expect(run('1234567890123456789')).toBe('123456789012345')
    expect(run('0.1234567890123456789')).toBe('0.12345678901234')
    expect(run('1234567890123456789 ±')).toBe('-123456789012345')
  })
})

describe('the four operations', () => {
  it('works them out', () => {
    expect(run('8 + 5 =')).toBe('13')
    expect(run('8 − 5 =')).toBe('3')
    expect(run('8 × 5 =')).toBe('40')
    expect(run('8 ÷ 5 =')).toBe('1.6')
    expect(run('5 − 9 =')).toBe('-4')
  })

  it('does × and ÷ before + and −', () => {
    expect(run('2 + 3 × 4 =')).toBe('14')
    expect(run('2 × 3 + 4 =')).toBe('10')
    expect(run('10 − 2 × 3 =')).toBe('4')
    expect(run('2 + 3 × 4 × 2 =')).toBe('26')
    expect(run('10 − 4 − 3 =')).toBe('3')
    expect(run('8 ÷ 2 × 3 =')).toBe('12')
    expect(run('20 − 12 ÷ 4 + 1 =')).toBe('18')
  })

  it('shows the running total when you press an operator', () => {
    expect(run('2 + 3 +')).toBe('5')
    expect(run('2 × 3 +')).toBe('6')
    expect(run('2 + 3 × 4 +')).toBe('14')
    // + 3 × is still waiting for what to multiply by, so the 3 stays on screen
    expect(run('2 + 3 ×')).toBe('3')
    expect(run('2 + 3 × 4 ×')).toBe('12')
  })

  it('adds up many values', () => {
    expect(run('1200 + 350 + 75 + 5 =')).toBe('1630')
  })
})

describe('exact decimals', () => {
  it('has no floating-point noise', () => {
    expect(run('0.1 + 0.2 =')).toBe('0.3')
    expect(run('1.1 × 3 =')).toBe('3.3')
    expect(run('1000000.1 − 1000000 =')).toBe('0.1')
  })

  it('keeps every digit of a large result', () => {
    expect(run('1234567890123 + 1 =')).toBe('1234567890124')
    expect(run('12500000000.55 + 0.01 =')).toBe('12500000000.56')
  })

  it('does not lose anything to a division inside the line', () => {
    expect(run('1 ÷ 3 × 3 =')).toBe('1')
    expect(run('2 ÷ 3 × 3 =')).toBe('2')
  })

  it('rounds a long result to 15 digits, halves away from zero', () => {
    expect(run('1 ÷ 3 =')).toBe('0.33333333333333')
    expect(run('2 ÷ 3 =')).toBe('0.66666666666667')
    expect(run('2 ± ÷ 3 =')).toBe('-0.66666666666667')
    expect(run('100 ÷ 3 =')).toBe('33.3333333333333')
  })

  it('writes tiny results as plain decimals', () => {
    expect(run('1 ÷ 3000000000 =')).toBe('0.00000000033333')
    expect(run(`1 ÷ ${LARGEST} =`)).toBe('0')
    expect(run(`1 ± ÷ ${LARGEST} =`)).toBe('0')
  })

  it('carries on from the rounded result that is on screen', () => {
    expect(run('1 ÷ 3 = × 3 =')).toBe('0.99999999999999')
  })

  it('uses the rounded total on screen for = right after an operator', () => {
    expect(run('1 ÷ 3 + 1 ÷ 3 =')).toBe('0.66666666666667')
    expect(run('1 ÷ 3 + =')).toBe('0.66666666666666')
  })

  it('puts the rounded result of % into the line', () => {
    // 100% of 2 ÷ 3 is 0.66666666666667 on screen, and that is what gets added
    expect(run('2 ÷ 3 + 100 % =')).toBe('1.33333333333334')
  })

  it('reuses a total too small to show as the 0 on screen', () => {
    expect(run(`1 ÷ ${LARGEST} ÷`)).toBe('0')
    expect(run(`1 ÷ ${LARGEST} ÷ =`)).toBe('Cannot divide by zero')
  })
})

describe('numbers too large to show', () => {
  it('shows the largest 15 digit result', () => {
    expect(run('999999999999998 + 1 =')).toBe(LARGEST)
    expect(run(`${LARGEST} ± − 0 =`)).toBe(`-${LARGEST}`)
  })

  it('is an error from 16 digits, with =, an operator or %', () => {
    expect(run(`${LARGEST} + 1 =`)).toBe('Number too large')
    expect(run(`${LARGEST} + 1 +`)).toBe('Number too large')
    expect(run(`${LARGEST} ± − 1 =`)).toBe('Number too large')
    expect(run(`${LARGEST} + 200 %`)).toBe('Number too large')
  })

  it('is an error when rounding is what adds the 16th digit', () => {
    expect(run(`${LARGEST} + .5 =`)).toBe('Number too large')
  })

  it('never turns a huge product into zero', () => {
    expect(run(`${Array(24).fill(LARGEST).join(' × ')} =`)).toBe('Number too large')
  })
})

describe('changing the operator', () => {
  it('uses the last one pressed', () => {
    expect(run('5 + × 3 =')).toBe('15')
    expect(line('5 + ×')).toBe('5 ×')
  })

  it('updates the running total to match', () => {
    expect(run('2 + 3 × +')).toBe('5')
    expect(run('2 + 3 + ×')).toBe('3')
    expect(run('2 × 3 + ÷')).toBe('6')
  })

  it('reports the operator that is waiting for a number', () => {
    expect(pendingOperator(play(''))).toBeNull()
    expect(pendingOperator(play('5'))).toBeNull()
    expect(pendingOperator(play('5 +'))).toBe('+')
    expect(pendingOperator(play('5 + ×'))).toBe('×')
    expect(pendingOperator(play('5 + 3'))).toBeNull()
    expect(pendingOperator(play('5 + 3 ='))).toBeNull()
    expect(pendingOperator(play('200 + 10 %'))).toBeNull()
  })
})

describe('plus or minus', () => {
  it('flips the number being typed, a typed 0 included', () => {
    expect(run('5 ±')).toBe('-5')
    expect(run('5 ± ±')).toBe('5')
    expect(run('1 ± 2')).toBe('-12')
    expect(run('0. ±')).toBe('-0.')
    expect(run('0 ±')).toBe('-0')
    expect(run('0 ± 3')).toBe('-3')
    expect(run('5 + 0 ± 3')).toBe('-3')
    expect(run('5 + 0 ± =')).toBe('5')
  })

  it('pressed before a number, waits for it', () => {
    expect(run('±')).toBe('-0')
    expect(run('± 5')).toBe('-5')
    expect(run('± .5')).toBe('-0.5')
    expect(run('5 + ±')).toBe('-0')
    expect(run('5 + ± 3')).toBe('-3')
    expect(run('5 + ± 3 =')).toBe('2')
    expect(run('5 × ± .5 =')).toBe('-2.5')
    expect(run('5 + ± 0 3 =')).toBe('2')
    expect(run('5 − 5 = ± 3')).toBe('-3')
  })

  it('leaves the line and the waiting operator in place meanwhile', () => {
    expect(line('5 + ±')).toBe('5 +')
    expect(pendingOperator(play('5 + ±'))).toBe('+')
    expect(line('5 − 5 = ±')).toBe('')
  })

  it.each(['± ±', '± ⌫'])('can be taken back with %s', (undo) => {
    expect(run(`5 × ${undo}`)).toBe('5')
    expect(run(`5 × ${undo} =`)).toBe('25')
    expect(run(`5 + ${undo} × 3 =`)).toBe('15')
    expect(run(`5 + ${undo} 3 =`)).toBe('8')
    expect(line(`5 × ${undo} +`)).toBe('5 +')
  })

  it('is dropped when no number follows it', () => {
    expect(run('5 + ± =')).toBe('10')
    expect(run('5 × ± =')).toBe('25')
    expect(run('5 ÷ ± =')).toBe('1')
    expect(run('5 + ± × 3 =')).toBe('15')
    expect(line('5 + ± ×')).toBe('5 ×')
    expect(run('200 + ± %')).toBe('400')
    expect(run('± =')).toBe('0')
    expect(run('± + 3 =')).toBe('3')
  })

  it('never shows a result of -0', () => {
    expect(run('0. ± 0 =')).toBe('0')
    expect(line('5 + ± 0 +')).toBe('5 + 0 +')
  })

  it('flips a result, which the next operator carries on from', () => {
    expect(run('8 + 5 = ±')).toBe('-13')
    expect(run('8 + 5 = ± + 3 =')).toBe('-10')
    expect(line('8 + 5 = ±')).toBe('')
  })

  it('holds its two rules after every sequence of up to four keys', () => {
    const all: CalcKey[] = ['0', '5', '.', '+', '×', '÷', '=', '%', '±', '⌫', 'C']
    const after: CalcKey[] = ['+', '−', '×', '÷', '=', '%']
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
    const broken: string[] = []

    let reached = [{ typed: '', state: initialCalc() }]
    for (let length = 0; length <= 4; length++) {
      for (const { typed, state } of reached) {
        // An error ignores ±, and on a result ± also clears the finished line.
        if (state.error || state.finished) continue
        const flipped = press(state, '±')
        if (!same(press(flipped, '±'), state)) broken.push(`${typed}: ± ± is not undone`)
        // With no number yet, the next key must act as if ± had not been pressed.
        const noNumberYet = state.entry === 'operator' || (state.entry === 'settled' && state.display === '0')
        if (!noNumberYet || screenText(state) === '-0') continue
        for (const key of after) {
          if (!same(press(flipped, key), press(state, key))) broken.push(`${typed}: ± changes ${key}`)
        }
        if (!same(press(flipped, '⌫'), state)) broken.push(`${typed}: ⌫ does not take ± back`)
      }
      if (length < 4) {
        reached = reached.flatMap(({ typed, state }) =>
          all.map((key) => ({ typed: `${typed} ${key}`, state: press(state, key) })),
        )
      }
    }
    expect(broken.slice(0, 5)).toEqual([])
  })
})

describe('percent', () => {
  it('after + or − is a percentage of the total so far', () => {
    expect(run('200 + 10 % =')).toBe('220')
    expect(run('200 − 10 % =')).toBe('180')
    // 100 + 200 = 300 so far, 10% of that is 30
    expect(run('100 + 200 + 10 % =')).toBe('330')
  })

  it('anywhere else divides by 100', () => {
    expect(run('50 %')).toBe('0.5')
    expect(run('50 ± %')).toBe('-0.5')
    expect(run('200 × 10 % =')).toBe('20')
    expect(run('8 + 5 = %')).toBe('0.13')
  })

  it('keeps the value when you carry on', () => {
    expect(run('200 + 10 % + 5 =')).toBe('225')
    expect(line('200 + 10 % +')).toBe('200 + 20 +')
  })

  it('shows its value on the screen, and adds it to the line with the next operator', () => {
    expect(line('200 + 10 %')).toBe('200 +')
  })

  it('on a result, clears the finished line', () => {
    expect(line('8 + 5 = %')).toBe('')
  })
})

describe('backspace', () => {
  it('removes the last character of what is being typed', () => {
    expect(run('123 ⌫')).toBe('12')
    expect(run('1 ⌫')).toBe('0')
    expect(run('0. ⌫')).toBe('0')
    expect(run('5 ± ⌫')).toBe('0')
    expect(run('5 + 3 ± ⌫')).toBe('0')
  })

  it('leaves results and running totals alone', () => {
    expect(run('8 + 5 = ⌫')).toBe('13')
    expect(run('8 + 5 + ⌫')).toBe('13')
    expect(run('200 + 10 % ⌫')).toBe('20')
  })
})

describe('equals', () => {
  it('uses the number on screen right after an operator', () => {
    expect(run('5 + =')).toBe('10')
  })

  it('does nothing more when pressed again', () => {
    expect(run('8 + 5 = =')).toBe('13')
    expect(line('8 + 5 = =')).toBe('8 + 5 =')
  })

  it('with no operator keeps the number, and the next digit starts over', () => {
    expect(run('12 =')).toBe('12')
    expect(run('12 = 3')).toBe('3')
  })

  it('lets the next operator carry on from the result', () => {
    expect(run('8 + 5 = × 2 =')).toBe('26')
  })

  it('lets the next digit start a new calculation', () => {
    expect(run('8 + 5 = 2')).toBe('2')
    expect(run('8 + 5 = .5')).toBe('0.5')
    expect(line('8 + 5 = 2')).toBe('')
  })
})

describe('errors and clearing', () => {
  it('reports a division by zero from =, + or ×', () => {
    expect(run('5 ÷ 0 =')).toBe('Cannot divide by zero')
    expect(run('5 ÷ 0 +')).toBe('Cannot divide by zero')
    expect(run('5 ÷ 0 ×')).toBe('Cannot divide by zero')
    expect(run('2 + 5 ÷ 0. ×')).toBe('Cannot divide by zero')
  })

  it('ignores other keys until a number or C', () => {
    expect(run('5 ÷ 0 = + − % ± ⌫ =')).toBe('Cannot divide by zero')
    expect(run('5 ÷ 0 = 7')).toBe('7')
    expect(run('5 ÷ 0 = .')).toBe('0.')
    expect(run('5 ÷ 0 = C')).toBe('0')
  })

  it('clears everything with C', () => {
    expect(run('5 + 3 C 2 =')).toBe('2')
    expect(line('5 + 3 C')).toBe('')
  })

  it('never changes the state it was given', () => {
    const before = play('2 + 3 × 4')
    const copy = structuredClone(before)
    for (const key of keys('1 . + − × ÷ = C ⌫ ± %')) press(before, key)
    expect(before).toEqual(copy)

    const signed = play('2 + ±')
    const signedCopy = structuredClone(signed)
    for (const key of keys('1 . + = ⌫ ± %')) press(signed, key)
    expect(signed).toEqual(signedCopy)
  })
})

describe('the running line', () => {
  it('is empty until there is an operator', () => {
    expect(line('')).toBe('')
    expect(line('12')).toBe('')
  })

  it('shows each value as it is added, including the one being typed', () => {
    expect(line('2 +')).toBe('2 +')
    expect(line('2 + 3')).toBe('2 + 3')
    expect(line('2 + 3 +')).toBe('2 + 3 +')
    expect(line('2 + 3 + 7')).toBe('2 + 3 + 7')
    expect(line('2 + 3.')).toBe('2 + 3.')
  })

  it('adds thousands separators', () => {
    expect(line('1200 + 350 × 2')).toBe('1,200 + 350 × 2')
  })

  it('shows the whole calculation with = once it is done', () => {
    expect(line('2 + 3 + 7 =')).toBe('2 + 3 + 7 =')
  })

  it('puts a negative number in brackets, while typing and after', () => {
    expect(line('5 + 3 ±')).toBe('5 + (-3)')
    expect(line('5 + 3 ± +')).toBe('5 + (-3) +')
    expect(line('5 − 9 = +')).toBe('(-4) +')
    expect(line('5 + 3 ± =')).toBe('5 + (-3) =')
  })

  it('carries on from a result', () => {
    expect(line('8 + 5 = ×')).toBe('13 ×')
    expect(line('8 + 5 = × 2')).toBe('13 × 2')
  })

  it('is empty after an error', () => {
    expect(line('5 ÷ 0 =')).toBe('')
  })
})

describe('pasting an amount', () => {
  /** The state after pressing `before`, pasting `text` and pressing `after`. */
  const pasted = (before: string, text: string, after = '') => {
    const state = pasteAmount(play(before), text)
    if (state === null) throw new Error(`refused: ${text}`)
    return keys(after).reduce(press, state)
  }

  it('takes one amount, without its commas or peso mark', () => {
    expect(screenText(pasted('', '1,234.50'))).toBe('1234.50')
    expect(screenText(pasted('', '₱30,125.75'))).toBe('30125.75')
    expect(screenText(pasted('', ' Php. 50,000\n'))).toBe('50000')
  })

  it('writes it the way typing would', () => {
    expect(screenText(pasted('', '.5'))).toBe('0.5')
    expect(screenText(pasted('', '007'))).toBe('7')
    expect(screenText(pasted('', '000.25'))).toBe('0.25')
    expect(screenText(pasted('', '0.00'))).toBe('0.00')
  })

  it('takes up to 15 digits, so totals and its own results fit', () => {
    expect(screenText(pasted('', '999,999,999,999,999'))).toBe(LARGEST)
    expect(screenText(pasted('', '2,761,000,000.55'))).toBe('2761000000.55')
    expect(screenText(pasted('', '0.33333333333333'))).toBe('0.33333333333333')
  })

  it('gets back every positive result it shows', () => {
    for (const line of ['2 ÷ 3 =', '1 ÷ 3000000000 =', '999999999999998 + 1 =', '1250.75 × 12 =']) {
      const result = play(line).display
      expect(screenText(pasted('', formatDisplay(result)))).toBe(result)
    }
  })

  it.each(['1,000,000,000,000,000', '0.123456789012345', '-5', '5 + 3', '12,34', 'abc', ''])('refuses %j', (text) => {
    expect(pasteAmount(play('12 + 3'), text)).toBeNull()
  })

  it('replaces the number being typed, sign included', () => {
    expect(screenText(pasted('123', '45'))).toBe('45')
    expect(screenText(pasted('5 ±', '45'))).toBe('45')
    expect(line('5 + 3')).toBe('5 + 3')
    expect(expressionText(pasted('5 + 3', '45'))).toBe('5 + 45')
  })

  it('is the next number after an operator', () => {
    expect(screenText(pasted('5 ×', '1,000', '='))).toBe('5000')
    expect(screenText(pasted('200 +', '10', '% ='))).toBe('220')
  })

  it('takes a waiting minus sign', () => {
    expect(screenText(pasted('±', '45'))).toBe('-45')
    expect(screenText(pasted('5 + ±', '45', '='))).toBe('-40')
  })

  it('starts a new calculation after a result or an error', () => {
    expect(expressionText(pasted('8 + 5 =', '45'))).toBe('')
    expect(screenText(pasted('8 + 5 =', '45', '+ 1 ='))).toBe('46')
    expect(screenText(pasted('5 ÷ 0 =', '45'))).toBe('45')
  })

  it('can be edited like a typed number', () => {
    expect(screenText(pasted('', '45', '6'))).toBe('456')
    expect(screenText(pasted('', '45', '⌫'))).toBe('4')
    expect(screenText(pasted('', '45', '±'))).toBe('-45')
  })

  it('never changes the state it was given', () => {
    const before = play('2 + ±')
    const copy = structuredClone(before)
    pasteAmount(before, '45')
    expect(before).toEqual(copy)
  })
})

describe('formatDisplay', () => {
  it('adds thousands separators', () => {
    expect(formatDisplay('1234567')).toBe('1,234,567')
    expect(formatDisplay('-1234.5')).toBe('-1,234.5')
    expect(formatDisplay('999')).toBe('999')
    expect(formatDisplay('0.1234567')).toBe('0.1234567')
  })

  it('keeps a typed trailing dot and zeros', () => {
    expect(formatDisplay('12.')).toBe('12.')
    expect(formatDisplay('1000.0')).toBe('1,000.0')
  })
})
