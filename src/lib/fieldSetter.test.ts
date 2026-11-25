import { describe, expect, it, vi } from 'vitest'
import { fieldSetter } from './fieldSetter.ts'
import { newBusiness, newEmployer } from './yearForm.ts'

describe('fieldSetter', () => {
  it('saves a new value for one field and keeps the rest of the employer', () => {
    const employer = { ...newEmployer(1, 2), basic: '30000', taxWithheld: '500' }
    const onChange = vi.fn()
    fieldSetter(employer, onChange)('basic')('45000')
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...employer, basic: '45000' })
  })

  it('does not change the employer it was given', () => {
    const employer = newEmployer(1, 2)
    fieldSetter(employer, () => {})('basic')('1')
    expect(employer.basic).toBe('')
  })

  it('works for fields that are not text, such as a switch or a list', () => {
    const employer = newEmployer(1, 2)
    const onChange = vi.fn()
    const set = fieldSetter(employer, onChange)
    set('hasDeMinimis')(true)
    expect(onChange).toHaveBeenLastCalledWith({ ...employer, hasDeMinimis: true })
    set('mode')('ytd')
    expect(onChange).toHaveBeenLastCalledWith({ ...employer, mode: 'ytd' })
  })

  it('works for any object, not only an employer', () => {
    const business = { ...newBusiness(1), amount: '1000' }
    const onChange = vi.fn()
    fieldSetter(business, onChange)('deduction')('itemized')
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...business, deduction: 'itemized' })
  })
})
