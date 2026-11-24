import { describe, expect, it } from 'vitest'
import { monthlyOutcome, type MonthlyInput } from './monthlyOutcome.ts'

const input = (overrides: Partial<MonthlyInput> = {}): MonthlyInput => ({
  year: 2026,
  taxpayer: { type: 'employee', method: 'graduated' },
  basic: '',
  allowance: '',
  deMinimis: '',
  bonus: '',
  minimumWage: false,
  paysSss: false,
  paysPhilhealth: false,
  pagibig: '',
  ...overrides,
})

const ready = (overrides: Partial<MonthlyInput>) => {
  const outcome = monthlyOutcome(input(overrides))
  if (!outcome.ok) throw new Error(`expected a result, got: ${outcome.message}`)
  return outcome
}

describe('monthlyOutcome: nothing to work out', () => {
  it('asks for a salary when it is blank or zero, in words for the taxpayer type', () => {
    const employee = monthlyOutcome(input())
    expect(employee).toMatchObject({ ok: false, empty: true })
    expect(employee.ok === false && employee.message).toContain('monthly salary')

    const self = monthlyOutcome(input({ taxpayer: { type: 'self-employed', method: 'graduated' }, basic: '0' }))
    expect(self).toMatchObject({ ok: false, empty: true })
    expect(self.ok === false && self.message).toContain('what you receive')
  })

  it('says so when an amount is not a number, and that is not the empty state', () => {
    expect(monthlyOutcome(input({ basic: '35,000', allowance: 'abc' }))).toEqual({
      ok: false,
      message: 'One of the amounts is not a valid number.',
    })
  })
})

describe('monthlyOutcome: an employee', () => {
  it('works out 35,000 a month, and keeps the typed lines for the payslip', () => {
    const { result, lines } = ready({ basic: '₱ 35,000' })
    expect(result.takeHomeMonthly).toBe(30_473.75)
    expect(result.taxYearly).toBe(20_415)
    expect(lines).toEqual({ basic: 35_000, allowance: 0, deMinimis: 0 })
  })

  it('counts allowances and de minimis in the lines', () => {
    const { lines } = ready({ basic: '30000', allowance: '2,000', deMinimis: '1,500' })
    expect(lines).toEqual({ basic: 30_000, allowance: 2_000, deMinimis: 1_500 })
  })

  it('takes the bonus as a yearly total, and puts its tax with the bonuses', () => {
    const { result } = ready({ basic: '35000', bonus: '150000' })
    expect(result.taxYearly).toBe(31_720)
    expect(result.taxOnBonuses).toBe(11_305)
  })

  it('pays no income tax as a minimum wage earner', () => {
    expect(ready({ basic: '18000', minimumWage: true }).result.taxYearly).toBe(0)
  })

  it('ignores what was typed for the self-employed', () => {
    const { result } = ready({ basic: '35000', pagibig: '5,000', paysSss: true, paysPhilhealth: true })
    expect(result.pagibig).toBe(200)
  })

  it('is not blocked by a bad number in a field only the self-employed use', () => {
    expect(ready({ basic: '35000', pagibig: 'abc' }).result.takeHomeMonthly).toBe(30_473.75)
  })
})

describe('monthlyOutcome: the self-employed', () => {
  const self = (overrides: Partial<MonthlyInput> = {}) =>
    ready({ taxpayer: { type: 'self-employed', method: 'eight-percent' }, basic: '100000', ...overrides })

  it('works out the 8% option on 100,000 a month', () => {
    const { result, lines } = self()
    expect(result.taxYearly).toBe(76_000)
    expect(lines).toEqual({ basic: 100_000, allowance: 0, deMinimis: 0 })
  })

  it('takes the contributions only as chosen', () => {
    const none = self().result
    expect([none.sss, none.philhealth, none.pagibig]).toEqual([0, 0, 0])
    expect(self({ pagibig: '200' }).result.pagibig).toBe(200)
    expect(self({ paysSss: true }).result.sss).toBeGreaterThan(0)
    expect(self({ paysPhilhealth: true }).result.philhealth).toBeGreaterThan(0)
  })

  it('ignores the employee fields, even bad ones typed before switching', () => {
    const { lines } = self({ allowance: 'abc', deMinimis: '9,999', bonus: '1,000,000' })
    expect(lines).toEqual({ basic: 100_000, allowance: 0, deMinimis: 0 })
  })

  it('explains that the 8% option stops at its limit and offers graduated rates', () => {
    const outcome = monthlyOutcome(
      input({ taxpayer: { type: 'self-employed', method: 'eight-percent' }, basic: '1,000,000' }),
    )
    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.message).toMatch(/only covers up to ₱3,000,000\.00 a year/)
    expect(outcome.ok === false && outcome.message).toMatch(/Choose Graduated rates instead\.$/)
    expect(outcome.ok === false && outcome.empty).toBeUndefined()
  })
})

describe('monthlyOutcome: the engine says no', () => {
  it('gives a plain message, not the engine wording, and does not throw', () => {
    const outcome = monthlyOutcome(input({ year: 1990, basic: '35000' }))
    expect(outcome).toEqual({
      ok: false,
      message: 'Those figures could not be worked out. Check the amounts and the tax year.',
    })
  })
})
