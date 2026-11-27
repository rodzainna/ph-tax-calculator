import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  endOfYearIso,
  initialForm,
  MONTHS_PER_BUSINESS_PERIOD,
  newDeMinimisLine,
  newEmployer,
  soFarScenario,
  todayIso,
  withPayFrequency,
  withTaxpayer,
  withYear,
  yearEndScenario,
} from './yearForm.ts'
import { LATEST_TAX_YEAR } from './taxYears.ts'

afterEach(() => vi.useRealTimers())

describe('todayIso', () => {
  it('is the local date, not the UTC one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 2, 0, 30)) // 00:30 local time on 2 January
    expect(todayIso()).toBe('2026-01-02')
  })

  it('pads the month and the day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 5, 12, 0))
    expect(todayIso()).toBe('2026-03-05')
  })
})

describe('initialForm', () => {
  it('starts on the tax year of the date given, counted up to that date', () => {
    const form = initialForm('2025-03-09')
    expect(form.year).toBe(2025)
    expect(form.asOf).toBe('2025-03-09')
  })

  it('holds a later calendar year at the latest year with rules, still counting up to today', () => {
    const form = initialForm('2031-02-10')
    expect(form.year).toBe(LATEST_TAX_YEAR)
    expect(form.asOf).toBe('2031-02-10')
  })

  it('has one blank employer and the business section off', () => {
    const form = initialForm('2026-06-01')
    expect(form.employers).toHaveLength(1)
    expect(form.employers[0].basic).toBe('')
    expect(form.taxpayer.type).toBe('employee')
    expect(form.business.enabled).toBe(false)
  })

  it('hands out ids that are all different, and a next id that is free', () => {
    const form = initialForm('2026-06-01')
    const ids = [form.employers[0].id, form.employers[0].deMinimis[0].id, form.business.expenses[0].id]
    expect(new Set(ids).size).toBe(3)
    expect(ids).not.toContain(form.nextId)
    expect(Math.max(...ids)).toBeLessThan(form.nextId)
  })
})

describe('newEmployer', () => {
  it('is a monthly salary on the estimate settings, with nothing typed', () => {
    const employer = newEmployer(7, 8)
    expect(employer).toMatchObject({
      id: 7,
      mode: 'rate',
      frequency: 'monthly',
      thirteenthMode: 'estimate',
      contributionsMode: 'estimate',
      hasDeMinimis: false,
      startDate: '',
      endDate: '',
      basic: '',
      taxWithheld: '',
    })
    expect(employer.deMinimis).toEqual([{ id: 8, label: '', amount: '', per: 'month' }])
  })

  it('gives each employer its own lists', () => {
    const a = newEmployer(1, 2)
    const b = newEmployer(3, 4)
    expect(a.deMinimis).not.toBe(b.deMinimis)
    expect(a.customContributions).not.toBe(b.customContributions)
  })
})

describe('how often a benefit is paid', () => {
  const job = newEmployer(1, 2)

  it.each([
    ['monthly', 'month'],
    ['semi-monthly', 'payout'],
    ['yearly', 'year'],
  ] as const)('starts as the salary is paid: %s', (frequency, per) => {
    expect(newDeMinimisLine(3, frequency).per).toBe(per)
    expect(withPayFrequency(job, frequency).deMinimis[0]!.per).toBe(per)
    expect(withPayFrequency(job, frequency).frequency).toBe(frequency)
  })

  it('goes on following the salary through several changes, while nothing is typed', () => {
    const changed = withPayFrequency(withPayFrequency(job, 'yearly'), 'semi-monthly')
    expect(changed.deMinimis[0]!.per).toBe('payout')
  })

  it.each([
    ['has an amount', { id: 2, label: 'Rice', amount: '1111', per: 'month' }],
    ['had its frequency chosen', { id: 2, label: '', amount: '', per: 'month', perChosen: true }],
  ] as const)('is left alone once a row %s', (_, line) => {
    const changed = withPayFrequency({ ...job, deMinimis: [line] }, 'semi-monthly')
    expect(changed.deMinimis).toEqual([line])
  })
})

describe('withTaxpayer', () => {
  const base = initialForm('2026-06-01')

  it('turns the business section on for the self-employed and mixed income, off for an employee', () => {
    expect(withTaxpayer(base, { type: 'self-employed', method: 'eight-percent' }).business.enabled).toBe(true)
    expect(withTaxpayer(base, { type: 'mixed', method: 'graduated' }).business.enabled).toBe(true)
    const back = withTaxpayer(withTaxpayer(base, { type: 'mixed', method: 'graduated' }), {
      type: 'employee',
      method: 'graduated',
    })
    expect(back.business.enabled).toBe(false)
  })

  it('keeps what was typed in the business section when it is switched off', () => {
    const typed = { ...base, business: { ...base.business, enabled: true, amount: '50,000' } }
    expect(withTaxpayer(typed, { type: 'employee', method: 'graduated' }).business.amount).toBe('50,000')
  })

  it('does not change the form it was given', () => {
    withTaxpayer(base, { type: 'mixed', method: 'graduated' })
    expect(base.taxpayer.type).toBe('employee')
    expect(base.business.enabled).toBe(false)
  })
})

describe('withYear', () => {
  const dated = () => {
    const form = initialForm('2026-06-01')
    form.employers[0].startDate = '2026-02-01'
    form.employers[0].endDate = '2026-09-30'
    form.business.startDate = '2026-03-15'
    form.business.endDate = ''
    return form
  }

  it('keeps dates that are in the new year and blanks', () => {
    const same = withYear(dated(), 2026)
    expect(same.employers[0].startDate).toBe('2026-02-01')
    expect(same.employers[0].endDate).toBe('2026-09-30')
    expect(same.business.startDate).toBe('2026-03-15')
    expect(same.business.endDate).toBe('')
  })

  it('clears the dates that fall outside the new year, for employers and the business', () => {
    const next = withYear(dated(), 2025)
    expect(next.year).toBe(2025)
    expect(next.employers[0].startDate).toBe('')
    expect(next.employers[0].endDate).toBe('')
    expect(next.business.startDate).toBe('')
  })

  it('clears only the date that is outside, and leaves everything else alone', () => {
    const form = dated()
    form.employers[0].endDate = '2025-12-31'
    form.employers[0].basic = '30,000'
    const next = withYear(form, 2025)
    expect(next.employers[0].endDate).toBe('2025-12-31')
    expect(next.employers[0].startDate).toBe('')
    expect(next.employers[0].basic).toBe('30,000')
  })

  it('does not change the form it was given', () => {
    const form = dated()
    withYear(form, 2025)
    expect(form.year).toBe(2026)
    expect(form.employers[0].startDate).toBe('2026-02-01')
  })
})

describe('scenarios', () => {
  it('counts the full year to December 31', () => {
    expect(endOfYearIso(2026)).toBe('2026-12-31')
    expect(yearEndScenario(2025)).toEqual({ projectionEnd: '2025-12-31' })
  })

  it('counts "so far" to the as-of date', () => {
    expect(soFarScenario('2026-06-15')).toEqual({ projectionEnd: '2026-06-15' })
  })
})

describe('MONTHS_PER_BUSINESS_PERIOD', () => {
  it('is 1, 3 and 12 months', () => {
    expect(MONTHS_PER_BUSINESS_PERIOD).toEqual({ month: 1, quarter: 3, year: 12 })
  })
})
