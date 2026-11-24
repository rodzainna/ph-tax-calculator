// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import { newEmployer } from '@/lib/yearForm.ts'
import CustomContributions from './CustomContributions.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const start = () => newEmployer(1, 2).customContributions

const show = (value = start()) => {
  const onChange = vi.fn()
  render(<CustomContributions value={value} onChange={onChange} />)
  return onChange
}

describe('CustomContributions', () => {
  it('has a field and a "how often" choice for each of SSS, PhilHealth and Pag-IBIG', () => {
    show()
    for (const label of ['SSS', 'PhilHealth', 'Pag-IBIG']) {
      expect(screen.getByRole('textbox', { name: label })).toBeTruthy()
      expect(screen.getByRole('combobox', { name: `${label}: how often` }).textContent).toBe('Monthly')
    }
  })

  it('shows what is already typed', () => {
    const value = { ...start(), philhealth: { amount: '750', per: 'twice' as const } }
    show(value)
    expect((screen.getByRole('textbox', { name: 'PhilHealth' }) as HTMLInputElement).value).toBe('750')
    expect(screen.getByRole('combobox', { name: 'PhilHealth: how often' }).textContent).toBe('Twice a month')
  })

  it('reports an amount with only that one contribution changed', async () => {
    const value = { ...start(), sss: { amount: '1000', per: 'month' as const } }
    const onChange = show(value)
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'PhilHealth' }), '5')
    expect(onChange).toHaveBeenCalledWith({ ...value, philhealth: { amount: '5', per: 'month' } })
  })

  it('reports how often with the amount kept', async () => {
    const user = userEvent.setup()
    const value = { ...start(), pagibig: { amount: '200', per: 'month' as const } }
    const onChange = show(value)
    await user.click(screen.getByRole('combobox', { name: 'Pag-IBIG: how often' }))
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Total so far' }))
    expect(onChange).toHaveBeenCalledWith({ ...value, pagibig: { amount: '200', per: 'overall' } })
  })

  it('does not change the value it was given', async () => {
    const value = start()
    show(value)
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'SSS' }), '9')
    expect(value.sss.amount).toBe('')
  })
})
