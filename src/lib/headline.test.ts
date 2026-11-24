import { describe, expect, it } from 'vitest'
import { annualReturnWithEightPercent } from '../engine/annualReturn.ts'
import { headlineFor } from './headline.ts'

// 35,000 a month in 2026: 20,415 tax for the year.
const withWithholding = (taxWithheld: number) =>
  annualReturnWithEightPercent({
    year: 2026,
    employers: [
      {
        label: 'Employer',
        regularPay: 420_000,
        thirteenthMonthAndBenefits: 35_000,
        deMinimisExcess: 0,
        mandatoryContributions: 33_900,
        taxWithheld,
      },
    ],
  })

describe('headlineFor', () => {
  it('shows the full tax when no credit is known', () => {
    expect(headlineFor(withWithholding(0))).toEqual({ label: 'Income tax', amount: 20_415, tone: 'neutral' })
  })

  it('shows what is still owed when the credits fall short', () => {
    expect(headlineFor(withWithholding(15_000))).toEqual({ label: "You'd still owe", amount: 5_415, tone: 'owe' })
  })

  it('shows the overpayment as a positive amount when the credits are more than the tax', () => {
    expect(headlineFor(withWithholding(25_000))).toEqual({ label: "You'd be overpaid by", amount: 4_585, tone: 'ok' })
  })

  it('says nothing is left when the credits match the tax exactly', () => {
    expect(headlineFor(withWithholding(20_415))).toEqual({ label: 'Nothing left to pay', amount: 0, tone: 'ok' })
  })
  it('leaves out a credit that is not certified yet, as the balance does', () => {
    const r = annualReturnWithEightPercent({
      year: 2026,
      business: { grossReceipts: 1_200_000, pendingCreditableWithholding: 10_000 },
    })
    expect(headlineFor(r)).toEqual({ label: 'Income tax', amount: 76_000, tone: 'neutral' })
  })
})
