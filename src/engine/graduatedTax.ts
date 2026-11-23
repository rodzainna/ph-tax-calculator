import { roundToCentavos, roundToPeso } from './money.ts'
import { GRADUATED_RULES, type GraduatedRuleSet } from './rules/graduated.ts'

export class UnsupportedYearError extends Error {
  readonly year: number
  constructor(year: number) {
    super(`No tax rules for tax year ${year}`)
    this.name = 'UnsupportedYearError'
    this.year = year
  }
}

/** Finds the table in force for a tax year, or throws if there is none. */
export function graduatedRulesFor(year: number): GraduatedRuleSet {
  const rules = GRADUATED_RULES.find(
    (r) => year >= r.fromYear && (r.toYear === null || year <= r.toYear),
  )
  if (!rules) throw new UnsupportedYearError(year)
  return rules
}

/** Income tax under the graduated rates for the tax year, rounded to the centavo; zero or negative income owes nothing. */
export function graduatedTax(taxableIncome: number, year: number): number {
  if (!Number.isFinite(taxableIncome)) {
    throw new TypeError(`taxableIncome must be a finite number, got ${taxableIncome}`)
  }
  const { brackets } = graduatedRulesFor(year)
  if (taxableIncome <= 0) return 0

  // The bracket that applies is the highest one whose lower edge is below the income.
  let applicable = brackets[0]
  for (const bracket of brackets) {
    if (taxableIncome > bracket.over) applicable = bracket
  }
  return roundToCentavos(applicable.base + applicable.rate * (taxableIncome - applicable.over))
}

/** The tax as the BIR form shows it: on a whole-peso taxable income, rounded to a whole peso. */
export function graduatedTaxToPeso(taxableIncome: number, year: number): number {
  return roundToPeso(graduatedTax(roundToPeso(taxableIncome), year))
}
