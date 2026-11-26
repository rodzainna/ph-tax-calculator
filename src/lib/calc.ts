/** The calculator's state and keys, with no UI. × and ÷ run before + and −, and the whole line stays visible. */
import { add, divide, multiply, parseDecimal, subtract, toDecimalText, type Fraction } from './fraction.ts'

type AdditiveOperator = '+' | '−'
export type Operator = AdditiveOperator | '×' | '÷'
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type CalcKey = Digit | '.' | Operator | '=' | 'C' | '⌫' | '±' | '%'

/** A value in the line and the operator typed after it. */
export interface Step {
  value: string
  operator: Operator
}

export interface CalcState {
  /** The number or total in play. `screenText` gives what the screen shows. */
  display: string
  /**
   * What `display` holds: a number being typed, the running total right after an operator, or a value that the next
   * digit replaces (the first 0, a result or a percentage).
   */
  entry: 'typing' | 'operator' | 'settled'
  /** ± was pressed with no number to flip yet, so the next number will be negative. */
  negateNext: boolean
  /** The line so far. The number being typed is only in `display`. */
  steps: Step[]
  /** After "=": the calculation that gave the result on screen. */
  finished: { steps: Step[]; last: string } | null
  error: string | null
}

export const initialCalc = (): CalcState => ({
  display: '0',
  entry: 'settled',
  negateNext: false,
  steps: [],
  finished: null,
  error: null,
})

/** The most digits a number can have, typed or worked out. */
const MAX_DIGITS = 15

const ZERO = parseDecimal('0')
const ONE = parseDecimal('1')
const HUNDRED = parseDecimal('100')

const isDigit = (key: CalcKey): key is Digit => /^\d$/.test(key)
const isAdditive = (operator: Operator): operator is AdditiveOperator => operator === '+' || operator === '−'
const digitCount = (text: string) => text.replace(/\D/g, '').length

/** "1.50" -> "1.5", "12." -> "12", "-0" -> "0". */
const tidy = (display: string) => toDecimalText(parseDecimal(display), MAX_DIGITS) ?? display

const combine = (total: Fraction, operator: AdditiveOperator, term: Fraction) =>
  operator === '+' ? add(total, term) : subtract(total, term)

/** Works out `steps` followed by `last`, × and ÷ first. Null for a division by zero. */
function evaluate(steps: Step[], last: string): Fraction | null {
  let total = ZERO
  let sign: AdditiveOperator = '+'
  let term = parseDecimal(steps[0]?.value ?? last)

  for (const [index, { operator }] of steps.entries()) {
    const next = parseDecimal(steps[index + 1]?.value ?? last)
    if (isAdditive(operator)) {
      total = combine(total, sign, term)
      sign = operator
      term = next
    } else {
      const result = operator === '×' ? multiply(term, next) : divide(term, next)
      if (result === null) return null
      term = result
    }
  }
  return combine(total, sign, term)
}

const fail = (error: string): CalcState => ({ ...initialCalc(), error })

/**
 * Passes the value on as rounded text, or gives the error state when there is no number to show. Later keys that reuse
 * a number from the screen calculate with this rounded text, so they use exactly what is shown.
 */
function withResult(value: Fraction | null, next: (text: string) => CalcState): CalcState {
  if (value === null) return fail('Cannot divide by zero')
  const text = toDecimalText(value, MAX_DIGITS)
  return text === null ? fail('Number too large') : next(text)
}

/** Starts a new number with `text`, negative if a minus sign is waiting. */
const startNumber = (state: CalcState, text: string): CalcState => ({
  ...state,
  display: state.negateNext ? `-${text}` : text,
  entry: 'typing',
  negateNext: false,
})

function typeDigit(state: CalcState, digit: Digit): CalcState {
  if (state.entry !== 'typing') return startNumber(state, digit)
  // A lone 0 is replaced and keeps its minus sign.
  if (/^-?0$/.test(state.display)) return { ...state, display: state.display.replace('0', digit) }
  if (digitCount(state.display) >= MAX_DIGITS) return state
  return { ...state, display: state.display + digit }
}

function typeDot(state: CalcState): CalcState {
  if (state.entry !== 'typing') return startNumber(state, '0.')
  return state.display.includes('.') ? state : { ...state, display: `${state.display}.` }
}

function backspace(state: CalcState): CalcState {
  if (state.negateNext) return { ...state, negateNext: false }
  if (state.entry !== 'typing') return state
  const rest = state.display.slice(0, -1)
  return { ...state, display: rest === '' || rest === '-' ? '0' : rest }
}

function toggleSign(state: CalcState): CalcState {
  // Right after an operator, or on a 0 that was not typed, there is no number to flip yet.
  if (state.entry === 'operator' || (state.entry === 'settled' && state.display === '0')) {
    return { ...state, negateNext: !state.negateNext, finished: null }
  }
  const display = state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`
  return { ...state, display, finished: null }
}

function percent(state: CalcState): CalcState {
  const previous = state.steps.at(-1)
  // After + or −, % is a share of the total so far: in 100 + 200 + 10 % it is 10% of 300. Elsewhere it divides by 100.
  const base = previous && isAdditive(previous.operator) ? evaluate(state.steps.slice(0, -1), previous.value) : ONE
  const share = base && divide(multiply(base, parseDecimal(state.display)), HUNDRED)
  return withResult(share, (display) => ({ ...state, display, entry: 'settled', finished: null }))
}

function equals(state: CalcState): CalcState {
  // Right after an operator, the running total on screen is used as the last number.
  const last = tidy(state.display)
  if (state.steps.length === 0) return { ...state, display: last, entry: 'settled' }
  return withResult(evaluate(state.steps, last), (display) => ({
    ...initialCalc(),
    display,
    finished: { steps: state.steps, last },
  }))
}

/** Where the × ÷ run that follows `steps` begins: after the last + or −. */
const productStart = (steps: Step[]) => steps.findLastIndex((step) => isAdditive(step.operator)) + 1

function pressOperator(state: CalcState, operator: Operator): CalcState {
  // Right after an operator, another one replaces it.
  const replaced = state.entry === 'operator' ? state.steps.at(-1) : undefined
  const earlier = replaced ? state.steps.slice(0, -1) : state.steps
  const value = replaced ? replaced.value : tidy(state.display)
  // + and − show the total of the whole line. × and ÷ show only the run they continue: 2 + 3 × shows 3.
  const shownFrom = isAdditive(operator) ? 0 : productStart(earlier)
  return withResult(evaluate(earlier.slice(shownFrom), value), (display) => ({
    display,
    entry: 'operator',
    negateNext: false,
    steps: [...earlier, { value, operator }],
    finished: null,
    error: null,
  }))
}

export function press(state: CalcState, key: CalcKey): CalcState {
  if (key === 'C') return initialCalc()
  if (isDigit(key) || key === '.') {
    // A number after an error or a result starts a new calculation.
    const from = state.error || state.finished ? initialCalc() : state
    return key === '.' ? typeDot(from) : typeDigit(from, key)
  }
  if (state.error) return state
  if (key === '±') return toggleSign(state)
  if (key === '⌫') return backspace(state)

  // A minus sign with no number after it is dropped, as if ± had not been pressed.
  const unsigned = { ...state, negateNext: false }
  switch (key) {
    case '%':
      return percent(unsigned)
    case '=':
      return equals(unsigned)
    default:
      return pressOperator(unsigned, key)
  }
}

/** What the screen shows: -0 while a minus sign waits for its number. */
export const screenText = ({ display, negateNext }: CalcState) => (negateNext ? '-0' : display)

/** The operator still waiting for its second number, if the last key was one. */
export const pendingOperator = (state: CalcState): Operator | null =>
  state.entry === 'operator' ? (state.steps.at(-1)?.operator ?? null) : null

/** Adds thousands separators to the whole part and keeps a typed trailing dot and zeros. */
export function formatDisplay(display: string): string {
  const [whole, decimals] = display.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimals === undefined ? grouped : `${grouped}.${decimals}`
}

/** A negative number goes in brackets, so its minus is not read as a subtraction. */
const formatOperand = (value: string) => (value.startsWith('-') ? `(${formatDisplay(value)})` : formatDisplay(value))

const formatSteps = (steps: Step[]) => steps.flatMap(({ value, operator }) => [formatOperand(value), operator])

/** The line above the screen, such as "1,200 + 350", ending in "=" once worked out. Empty until there is an operator. */
export function expressionText({ steps, finished, entry, display }: CalcState): string {
  if (finished) return [...formatSteps(finished.steps), formatOperand(finished.last), '='].join(' ')
  if (steps.length === 0) return ''
  const typed = entry === 'typing' ? [formatOperand(display)] : []
  return [...formatSteps(steps), ...typed].join(' ')
}
