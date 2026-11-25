import { describe, expect, it } from 'vitest'
import { initialTaxpayer, isSelfEmployed, usesBusiness, usesEmployers, type TaxpayerType } from './taxpayer.ts'

const taxpayer = (type: TaxpayerType) => ({ ...initialTaxpayer(), type })

describe('what counts for each kind of taxpayer', () => {
  it.each([
    ['employee', true, false],
    ['self-employed', false, true],
    ['mixed', true, true],
  ] as const)('%s: employers %s, business %s', (type, employers, business) => {
    expect(usesEmployers(taxpayer(type))).toBe(employers)
    expect(usesBusiness(taxpayer(type))).toBe(business)
  })

  it('starts as an employee on graduated rates', () => {
    expect(initialTaxpayer()).toEqual({ type: 'employee', method: 'graduated' })
  })

  it('knows who is self-employed', () => {
    expect(isSelfEmployed(taxpayer('self-employed'))).toBe(true)
    expect(isSelfEmployed(taxpayer('mixed'))).toBe(false)
  })
})
