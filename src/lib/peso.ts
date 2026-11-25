/** Turns what a person typed ("1,234.50", "₱ 600000", "") into a number. Blank means 0. */
export function parsePeso(text: string): number {
  const cleaned = text.replace(/[₱,\s]/g, '')
  if (cleaned === '') return 0
  // Number('') is 0 and Number('1e3') is 1000; only accept plain decimals.
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

const pesoFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export function formatPeso(amount: number): string {
  return pesoFormatter.format(amount)
}

/** The most whole-number digits a money field takes. It limits one entry: a total can go higher. */
export const MAX_WHOLE_DIGITS = 8

/**
 * What a money field shows while typing: commas in the whole part, at most two decimals, anything else dropped
 * ("400000" -> "400,000").
 */
export function formatPesoInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const dot = cleaned.indexOf('.')
  const fraction =
    dot === -1
      ? null
      : cleaned
          .slice(dot + 1)
          .replace(/\./g, '')
          .slice(0, 2)
  let whole = dot === -1 ? cleaned : cleaned.slice(0, dot)
  whole = whole.replace(/^0+(?=\d)/, '')
  if (whole === '' && fraction !== null) whole = '0'
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === null ? grouped : `${grouped}.${fraction}`
}

/** How many whole-number digits a text has before its decimal point, leading zeros not counted. */
export function wholeDigitCount(text: string): number {
  const cleaned = text.replace(/[^\d.]/g, '')
  const dot = cleaned.indexOf('.')
  return (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/^0+/, '').length
}

/** The largest amount a money field takes, as the field shows it. */
export const LARGEST_AMOUNT = formatPesoInput(`${'9'.repeat(MAX_WHOLE_DIGITS)}.99`)

/** An optional peso mark, then one amount: commas only between groups of three, at most two decimals. */
const PASTED_AMOUNT = /^\s*(?:₱|php\.?|p\.?)?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?|\.\d{1,2})\s*$/i

/** A pasted amount as the field shows it, or null if the text is anything else or the amount is too large. */
export function parsePastedAmount(text: string): string | null {
  const amount = PASTED_AMOUNT.exec(text)?.[1]
  return amount !== undefined && wholeDigitCount(amount) <= MAX_WHOLE_DIGITS ? formatPesoInput(amount) : null
}

/**
 * Whether a typed or deleted change has to be refused whole, because showing it would mean an amount the person did not
 * enter. `caret` is where the cursor ended up, so what follows it in `raw` was there before.
 */
export function isRefusedEdit(raw: string, previous: string, caret: number): boolean {
  const [, centavos = '', afterSecondDot] = raw.split('.')
  // A second dot would move the decimal point, and a third centavo digit would be cut off.
  if (afterSecondDot !== undefined || countPesoChars(centavos) > 2) return true
  // Taking the dot out from in front of centavos would turn them into pesos.
  if (previous.includes('.') && !raw.includes('.') && /\d/.test(raw.slice(caret))) return true
  return wholeDigitCount(raw) > MAX_WHOLE_DIGITS
}

/** The one character that was deleted to turn `before` into `after`, or null if it was not a single deletion. */
export function removedCharacter(before: string, after: string): string | null {
  if (after.length !== before.length - 1) return null
  for (let i = 0; i < before.length; i++) {
    if (before.slice(0, i) + before.slice(i + 1) === after) return before[i]
  }
  return null
}

/** How many digits and dots a text has: the characters that stay put when commas are added or removed. */
export const countPesoChars = (text: string): number => (text.match(/[\d.]/g) ?? []).length

/** How many digits and dots stay in front of the cursor when formatting `text` adds or drops leading zeros. */
export function charsBeforeCaret(text: string, before: string): number {
  const typed = countPesoChars(before)
  if (typed === 0) return 0
  const wholeLength = (amount: string) => countPesoChars(amount.split('.')[0])
  return Math.max(typed + wholeLength(formatPesoInput(text)) - wholeLength(text), 0)
}

/** Where the cursor goes after the text is reformatted: right after that many digits and dots. */
export function caretAfterFormat(formatted: string, charsBefore: number): number {
  if (charsBefore <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) {
      seen++
      if (seen === charsBefore) return i + 1
    }
  }
  return formatted.length
}

/** An amount in pieces, so a display can style the peso sign and the cents separately from the whole number. */
export function splitPeso(amount: number): { sign: string; symbol: string; whole: string; fraction: string } {
  let sign = ''
  let symbol = ''
  let whole = ''
  let fraction = ''
  for (const part of pesoFormatter.formatToParts(amount)) {
    if (part.type === 'minusSign') sign = part.value
    else if (part.type === 'currency') symbol = part.value
    else if (part.type === 'integer' || part.type === 'group') whole += part.value
    else if (part.type === 'fraction') fraction = part.value
  }
  return { sign, symbol, whole, fraction }
}

/** A rate as a short percentage: 0.05 -> "5%", 0.025 -> "2.5%", 0.0175 -> "1.75%". */
export function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`
}

const wholePesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

/** A peso amount without centavos, for places with little room: 20415.5 -> "₱20,416". */
export function formatPesoWhole(amount: number): string {
  return wholePesoFormatter.format(amount)
}
