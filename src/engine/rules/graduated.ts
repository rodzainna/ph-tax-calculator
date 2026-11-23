/** Graduated tables: NIRC Sec. 24(A)(2)(a) as amended by RA 10963 (2018-2022 and 2023 onward), checked against eBIRForms 1700/1701; tax = base + rate x (income - over). */
export interface Bracket {
  /** Lower edge of the bracket, in pesos (income "over" this amount). */
  over: number
  /** Marginal rate for the part of income above `over`. */
  rate: number
  /** Fixed tax on income up to `over`. */
  base: number
}

export interface GraduatedRuleSet {
  /** First tax year this table applies to. */
  fromYear: number
  /** Last tax year this table applies to, or null if still in force. */
  toYear: number | null
  /** Brackets sorted by `over`, ascending. */
  brackets: Bracket[]
  source: string
  verified: boolean
}

export const GRADUATED_RULES: GraduatedRuleSet[] = [
  {
    fromYear: 2018,
    toYear: 2022,
    brackets: [
      { over: 0, rate: 0, base: 0 },
      { over: 250_000, rate: 0.2, base: 0 },
      { over: 400_000, rate: 0.25, base: 30_000 },
      { over: 800_000, rate: 0.3, base: 130_000 },
      { over: 2_000_000, rate: 0.32, base: 490_000 },
      { over: 8_000_000, rate: 0.35, base: 2_410_000 },
    ],
    source: 'RA 10963 Sec. 5, NIRC Sec. 24(A)(2)(a): schedule effective 2018 until 2022',
    verified: true,
  },
  {
    fromYear: 2023,
    toYear: null,
    brackets: [
      { over: 0, rate: 0, base: 0 },
      { over: 250_000, rate: 0.15, base: 0 },
      { over: 400_000, rate: 0.2, base: 22_500 },
      { over: 800_000, rate: 0.25, base: 102_500 },
      { over: 2_000_000, rate: 0.3, base: 402_500 },
      { over: 8_000_000, rate: 0.35, base: 2_202_500 },
    ],
    source: 'RA 10963 Sec. 5, NIRC Sec. 24(A)(2)(a): schedule effective 2023 onwards',
    verified: true,
  },
]
