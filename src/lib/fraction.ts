/** Exact arithmetic on fractions, so that nothing is rounded until a number is written out. */
export interface Fraction {
  num: bigint
  /** Always above zero: the sign is on `num`. */
  den: bigint
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b))

const abs = (n: bigint): bigint => (n < 0n ? -n : n)

/** In lowest terms, so a long calculation does not keep growing its numbers. `den` must not be zero. */
function fraction(num: bigint, den: bigint): Fraction {
  const divisor = gcd(abs(num), abs(den)) * (den < 0n ? -1n : 1n)
  return { num: num / divisor, den: den / divisor }
}

/** Reads a plain decimal such as "-12.50", "0." or "-0". */
export function parseDecimal(text: string): Fraction {
  const [whole, decimals = ''] = text.split('.')
  return fraction(BigInt(whole + decimals), 10n ** BigInt(decimals.length))
}

export const add = (a: Fraction, b: Fraction): Fraction => fraction(a.num * b.den + b.num * a.den, a.den * b.den)

export const subtract = (a: Fraction, b: Fraction): Fraction => add(a, { num: -b.num, den: b.den })

export const multiply = (a: Fraction, b: Fraction): Fraction => fraction(a.num * b.num, a.den * b.den)

/** Null for a division by zero. */
export const divide = (a: Fraction, b: Fraction): Fraction | null =>
  b.num === 0n ? null : fraction(a.num * b.den, a.den * b.num)

/**
 * The fraction as a plain decimal of at most `maxDigits` digits, the leading zero of "0.5" included. Decimals that do
 * not fit are rounded off, halves away from zero. Null when the whole part alone is too long.
 */
export function toDecimalText({ num, den }: Fraction, maxDigits: number): string | null {
  const size = abs(num)
  const places = maxDigits - String(size / den).length
  if (places < 0) return null

  // The size times 10^places, rounded to the nearest integer.
  const scaled = (2n * size * 10n ** BigInt(places) + den) / (2n * den)
  const digits = String(scaled).padStart(places + 1, '0')
  const point = digits.length - places
  const whole = digits.slice(0, point)
  // Rounding up can add a digit: 99.99... becomes 100.
  if (whole.length > maxDigits) return null

  const decimals = digits.slice(point).replace(/0+$/, '')
  const sign = num < 0n && scaled !== 0n ? '-' : ''
  return sign + whole + (decimals ? `.${decimals}` : '')
}
