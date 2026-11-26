/**
 * Employee SSS, PhilHealth and Pag-IBIG shares as data keyed by effective month; each rule applies until the next starts.
 * `verified` means an official document supports the figures when they start. `notes` says what is assumed.
 */
export interface YearMonth {
  year: number
  month: number // 1-12
}

export interface SssRule {
  from: YearMonth
  /** Monthly Salary Credit (MSC) bounds and the step between brackets. */
  minMsc: number
  maxMsc: number
  step: number
  /** MSC above this goes to the MPF (WISP before 2025); at or below it is regular SS. */
  mpfThreshold: number
  /** Employee share, as a fraction of the MSC. Applies to both the regular and MPF parts. */
  employeeRate: number
  /** Whole contribution rate (employee + employer). Self-employed and voluntary members pay all of it. */
  totalRate: number
  source: string
  verified: boolean
  notes?: string
}

export interface PhilHealthRule {
  from: YearMonth
  /** Total premium rate on monthly basic salary. */
  rate: number
  floor: number
  ceiling: number
  /** Share paid by the employee (employed members split the premium equally). */
  employeeShare: number
  source: string
  verified: boolean
  notes?: string
}

export interface PagibigRule {
  from: YearMonth
  /** Maximum monthly fund salary the 2% is computed on. */
  cap: number
  employeeRate: number
  /** Fund salary at or below this uses `lowRate` instead. */
  lowThreshold: number
  lowRate: number
  source: string
  verified: boolean
  notes?: string
}

export const SSS_RULES: SssRule[] = [
  {
    from: { year: 2021, month: 1 },
    minMsc: 3_000,
    maxMsc: 25_000,
    step: 500,
    mpfThreshold: 20_000,
    employeeRate: 0.045,
    totalRate: 0.13,
    source: 'SSS Circular 2020-033-b (effective January 2021, 13%)',
    verified: true,
  },
  {
    from: { year: 2023, month: 1 },
    minMsc: 4_000,
    maxMsc: 30_000,
    step: 500,
    mpfThreshold: 20_000,
    employeeRate: 0.045,
    totalRate: 0.14,
    source: 'SSS Circular 2022-033 (effective January 2023, 14%); RA 11199 Sec. 4(a)(9)',
    verified: true,
    notes: 'RA 11199 lists the same rate and salary credit limits for 2024.',
  },
  {
    from: { year: 2025, month: 1 },
    minMsc: 5_000,
    maxMsc: 35_000,
    step: 500,
    mpfThreshold: 20_000,
    employeeRate: 0.05,
    totalRate: 0.15,
    source: 'SSS Circular 2024-006 (effective January 2025, 15%); RA 11199 Sec. 4(a)(9)',
    verified: true,
    notes:
      'Using these figures for 2026 is an assumption: the schedule in RA 11199 ends at 2025, and no official 2026 schedule was found (checked November 2026).',
  },
]

export const PHILHEALTH_RULES: PhilHealthRule[] = [
  {
    from: { year: 2021, month: 1 },
    rate: 0.035,
    floor: 10_000,
    ceiling: 70_000,
    employeeShare: 0.5,
    source: 'PhilHealth Circular 2020-0005 (Rev. 1) schedule',
    verified: true,
  },
  {
    from: { year: 2022, month: 1 },
    rate: 0.04,
    floor: 10_000,
    ceiling: 80_000,
    employeeShare: 0.5,
    source: 'PhilHealth Circular 2020-0005 (Rev. 1) schedule',
    verified: true,
  },
  {
    from: { year: 2023, month: 1 },
    rate: 0.04,
    floor: 10_000,
    ceiling: 80_000,
    employeeShare: 0.5,
    source:
      'PhilHealth statement of 4 January 2023 (4%, ceiling 80,000); its contribution table under Circular 2019-0009 (floor 10,000); UHC Act rules Sec. 8.2.a (equal shares)',
    verified: true,
    notes: 'The scheduled rise to 4.5% and to a 90,000 ceiling was suspended for 2023.',
  },
  {
    from: { year: 2024, month: 1 },
    rate: 0.05,
    floor: 10_000,
    ceiling: 100_000,
    employeeShare: 0.5,
    source: 'PhilHealth Advisory 2025-0002 and Circular 2020-0005 (Rev. 1); Advisory 2026-0042',
    verified: true,
  },
]

export const PAGIBIG_RULES: PagibigRule[] = [
  {
    from: { year: 2021, month: 1 },
    cap: 5_000,
    employeeRate: 0.02,
    lowThreshold: 1_500,
    lowRate: 0.01,
    source:
      'RA 9679 Sec. 7 (1% or 2%, 5,000 cap that the Board may change); DBM Circular Letter 2024-2 (cap raised from 5,000)',
    verified: true,
    notes: 'The cap is older than this: January 2021 is where the estimates start.',
  },
  {
    from: { year: 2024, month: 2 },
    cap: 10_000,
    employeeRate: 0.02,
    lowThreshold: 1_500,
    lowRate: 0.01,
    source: 'DBM Circular Letter 2024-2, which sets out Pag-IBIG Fund Circular 460 (from February 2024)',
    verified: true,
    notes:
      'Circular 460 itself was not read. Using these figures after 2024 assumes no later change: no newer circular was found (checked November 2026).',
  },
]

/** First tax year with an automatic contribution estimate. Earlier years are manual entry. */
export const CONTRIBUTIONS_FIRST_YEAR = 2021
