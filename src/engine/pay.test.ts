import { describe, expect, it } from 'vitest'
import { annualBasicPay, monthlyBasicSalary, thirteenthMonthPay } from './pay.ts'

describe('basic salary in any frequency', () => {
  it('turns each frequency into a monthly salary', () => {
    expect(monthlyBasicSalary({ amount: 30_000, frequency: 'monthly', monthsWorked: 12 })).toBe(30_000)
    expect(monthlyBasicSalary({ amount: 15_000, frequency: 'semi-monthly', monthsWorked: 12 })).toBe(30_000)
    expect(monthlyBasicSalary({ amount: 360_000, frequency: 'yearly', monthsWorked: 12 })).toBe(30_000)
  })

  it('earns the monthly salary over the months worked', () => {
    expect(annualBasicPay({ amount: 15_000, frequency: 'semi-monthly', monthsWorked: 7 })).toBe(210_000)
    expect(annualBasicPay({ amount: 360_000, frequency: 'yearly', monthsWorked: 6 })).toBe(180_000)
  })
})

describe('13th month pay: one-twelfth of the basic salary earned in the year', () => {
  it('equals one month of basic for a full year', () => {
    expect(thirteenthMonthPay({ amount: 30_000, frequency: 'monthly', monthsWorked: 12 })).toBe(30_000)
  })

  it('is prorated for part-year work, which also covers a resignation', () => {
    expect(thirteenthMonthPay({ amount: 15_000, frequency: 'semi-monthly', monthsWorked: 7 })).toBe(17_500)
    expect(thirteenthMonthPay({ amount: 360_000, frequency: 'yearly', monthsWorked: 6 })).toBe(15_000)
  })

  it('allows part months, such as resigning mid-month', () => {
    // 10.5 months of a 30,000 salary = 315,000 earned; one-twelfth is 26,250
    expect(thirteenthMonthPay({ amount: 30_000, frequency: 'monthly', monthsWorked: 10.5 })).toBe(26_250)
  })

  it('is zero before any month is worked', () => {
    expect(thirteenthMonthPay({ amount: 30_000, frequency: 'monthly', monthsWorked: 0 })).toBe(0)
  })

  it('rejects negative pay and impossible months', () => {
    expect(() => thirteenthMonthPay({ amount: -1, frequency: 'monthly', monthsWorked: 12 })).toThrow(RangeError)
    expect(() => thirteenthMonthPay({ amount: 1, frequency: 'monthly', monthsWorked: 13 })).toThrow(RangeError)
  })
})
