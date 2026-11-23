/** Employee SSS, PhilHealth and Pag-IBIG shares as data keyed by effective month; each rule applies until the next starts. */
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
    source: 'SSS Circular 2022-033 (effective January 2023, 14%)',
    verified: true,
    notes: 'Also applies to 2024: no other schedule exists between January 2023 and January 2025 (inferred).',
  },
  {
    from: { year: 2025, month: 1 },
    minMsc: 5_000,
    maxMsc: 35_000,
    step: 500,
    mpfThreshold: 20_000,
    employeeRate: 0.05,
    totalRate: 0.15,
    source: 'SSS Circular 2024-006 (effective January 2025, 15%)',
    verified: true,
    notes: '2026 is assumed unchanged: no newer circular found.',
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
    source: 'PhilHealth schedule footnote: rate "remains at 4% for CY 2023" (increase to 4.5% suspended)',
    verified: false,
    notes: 'Rate is official; the 2023 ceiling at the suspended 4% rate is assumed to stay at 80,000.',
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
    source: 'Circular 460 says the cap rose "from Five Thousand Pesos" in February 2024 (search snippet)',
    verified: false,
    notes: 'Cap of 5,000 before February 2024 is implied, not read from the circular.',
  },
  {
    from: { year: 2024, month: 2 },
    cap: 10_000,
    employeeRate: 0.02,
    lowThreshold: 1_500,
    lowRate: 0.01,
    source: 'Pag-IBIG Circular 460 (effective 1 February 2024; snippet), two 2026 payslips, infographic',
    verified: false,
    notes: 'Circular itself not read (site blocked by a bot check).',
  },
]

/** First tax year with an automatic contribution estimate. Earlier years are manual entry. */
export const CONTRIBUTIONS_FIRST_YEAR = 2021
