import { describe, expect, it } from 'vitest'
import { monthlyPay } from '../engine/monthlyPay.ts'
import { selfEmployedMonthlyPay } from '../engine/selfEmployedMonthly.ts'
import { payslipFor } from './payslip.ts'

const lines = (basic: number, allowance = 0, deMinimis = 0) => ({ basic, allowance, deMinimis })

/**
 * 35,000 a month in 2026 with a 35,000 13th month. The expected figures match an independent calculator,
 * except the cutoff net, where it adds up from rounded lines (see payslipFor).
 */
describe('payslipFor: 35,000 a month (2026)', () => {
  const result = monthlyPay({ year: 2026, monthlyBasic: 35_000 })

  it('monthly: as the monthly result says', () => {
    const p = payslipFor(result, lines(35_000), 'monthly')
    expect([p.basic, p.gross, p.sss, p.philhealth, p.pagibig, p.tax]).toEqual([35_000, 35_000, 1_750, 875, 200, 1_701.25])
    expect(p.totalDeductions).toBe(4_526.25)
    expect(p.net).toBe(30_473.75)
    expect(p.netBonuses).toBe(0)
  })

  it('cutoff: half of each line, rounded to the centavo', () => {
    const p = payslipFor(result, lines(35_000), 'cutoff')
    expect(p.basic).toBe(17_500)
    expect(p.gross).toBe(17_500)
    expect(p.sss).toBe(875)
    expect(p.philhealth).toBe(437.5)
    expect(p.pagibig).toBe(100)
    expect(p.tax).toBe(850.63) // half of 1,701.25 is 850.625
    expect(p.totalDeductions).toBe(2_263.13)
  })

  it('cutoff: the net is gross minus the total, so the slip adds up exactly', () => {
    const p = payslipFor(result, lines(35_000), 'cutoff')
    expect(p.net).toBe(15_236.87)
    expect(p.gross - p.totalDeductions).toBeCloseTo(p.net, 2)
    expect(p.sss + p.philhealth + p.pagibig + p.tax).toBeCloseTo(p.totalDeductions, 2)
    // within a centavo of half the monthly take-home
    expect(Math.abs(p.net - result.takeHomeMonthly / 2)).toBeLessThanOrEqual(0.011)
  })

  it('annual: twelve months of each line and the year\'s tax, with the 13th month shown apart', () => {
    const p = payslipFor(result, lines(35_000), 'annual')
    expect(p.basic).toBe(420_000)
    expect(p.gross).toBe(420_000)
    expect([p.sss, p.philhealth, p.pagibig]).toEqual([21_000, 10_500, 2_400])
    expect(p.tax).toBe(20_415)
    expect(p.totalDeductions).toBe(54_315)
    expect(p.net).toBe(365_685)
    expect(p.netBonuses).toBe(35_000) // under 90,000, so nothing taken off it
  })
})

describe('payslipFor: allowances and de minimis count in the gross', () => {
  it('shows each line, and the gross is their sum', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 30_000, monthlyTaxableAllowance: 2_000, monthlyDeMinimis: 1_500 })
    const p = payslipFor(r, lines(30_000, 2_000, 1_500), 'monthly')
    expect([p.basic, p.allowance, p.deMinimis, p.gross]).toEqual([30_000, 2_000, 1_500, 33_500])
    const annual = payslipFor(r, lines(30_000, 2_000, 1_500), 'annual')
    expect([annual.allowance, annual.deMinimis, annual.gross]).toEqual([24_000, 18_000, 402_000])
  })
})

describe('payslipFor: a big bonus', () => {
  // 35,000 a month with a 150,000 bonus: the tax the bonus causes (11,305) goes with the bonus, not the salary.
  const result = monthlyPay({ year: 2026, monthlyBasic: 35_000, yearlyBonuses: 150_000 })

  it('annual: the salary side keeps the tax it would have had alone; the bonus carries its own', () => {
    const p = payslipFor(result, lines(35_000), 'annual')
    expect(result.taxYearly).toBe(31_720)
    expect(p.tax).toBe(20_415) // 31,720 - 11,305
    expect(p.net).toBe(365_685)
    expect(p.netBonuses).toBe(138_695) // 150,000 - 11,305
  })

  it('the whole year take-home is the same however it is split', () => {
    const p = payslipFor(result, lines(35_000), 'annual')
    // gross 420,000 + bonus 150,000 - contributions 33,900 - the year's tax 31,720
    expect(p.net + p.netBonuses).toBe(420_000 + 150_000 - 33_900 - 31_720)
  })
})

describe('payslipFor: the self-employed', () => {
  it('has no bonuses and the same shape', () => {
    const r = selfEmployedMonthlyPay({ year: 2026, method: 'eight-percent', monthlyIncome: 100_000, paysSss: true })
    const m = payslipFor(r, lines(100_000), 'monthly')
    const a = payslipFor(r, lines(100_000), 'annual')
    expect(m.gross).toBe(100_000)
    expect(a.gross).toBe(1_200_000)
    expect(a.tax).toBe(76_000)
    expect(a.netBonuses).toBe(0)
    expect(a.net).toBe(a.gross - a.totalDeductions)
  })
})

describe('payslipFor: a minimum wage earner', () => {
  it('pays no tax in any slip', () => {
    const r = monthlyPay({ year: 2026, monthlyBasic: 18_000, isMinimumWageEarner: true })
    for (const period of ['monthly', 'cutoff', 'annual'] as const) {
      expect(payslipFor(r, lines(18_000), period).tax).toBe(0)
    }
  })
})
