import {
  annualReturnWithEightPercent,
  annualReturnWithGraduated,
  type AnnualReturnResult,
  type BusinessIncome,
} from '@/engine/annualReturn.ts'
import type { EmployerCompensation } from '@/engine/compensationTax.ts'

/** A salary of 600,000, 100,000 of 13th month and bonuses (10,000 over the exempt ceiling), 20,000 of contributions. */
export const salaryJob: EmployerCompensation = {
  label: 'Employer #1',
  regularPay: 600_000,
  thirteenthMonthAndBenefits: 100_000,
  deMinimisExcess: 0,
  mandatoryContributions: 20_000,
  taxWithheld: 50_000,
}

/** Real results from the tax engine for 2026, so a test reads figures that add up the way they do in the app. */
export const annualResults = {
  employee: (job: EmployerCompensation = salaryJob): AnnualReturnResult =>
    annualReturnWithGraduated({ year: 2026, employers: [job] }),
  eightPercent: (business: BusinessIncome, employers: EmployerCompensation[] = []): AnnualReturnResult =>
    annualReturnWithEightPercent({ year: 2026, employers, business }),
  graduated: (business: BusinessIncome, employers: EmployerCompensation[] = []): AnnualReturnResult =>
    annualReturnWithGraduated({ year: 2026, employers, business }),
}
