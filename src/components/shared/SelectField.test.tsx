// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import SelectField from './SelectField.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const show = () => {
  const onChange = vi.fn()
  render(<SelectField label="Paid" value="monthly" onChange={onChange} options={OPTIONS} />)
  return onChange
}

describe('SelectField', () => {
  it('is labelled, and shows the chosen option', () => {
    show()
    expect(screen.getByRole('combobox', { name: 'Paid' }).textContent).toBe('Monthly')
  })

  it('lists the options and reports the one chosen', async () => {
    const user = userEvent.setup()
    const onChange = show()
    await user.click(screen.getByRole('combobox', { name: 'Paid' }))
    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Monthly', 'Yearly'])
    await user.click(screen.getByRole('option', { name: 'Yearly' }))
    expect(onChange).toHaveBeenCalledWith('yearly')
  })

  it('opens the list below the field, not over it', async () => {
    await userEvent.setup().click((show(), screen.getByRole('combobox', { name: 'Paid' })))
    const content = document.querySelector('[data-slot=select-content]')
    // "item-aligned" is the mode that sits the chosen option on top of the field; the default is below it.
    expect(content?.getAttribute('data-align-trigger')).toBe('false')
    expect(content?.getAttribute('data-side')).toBe('bottom')
    expect(content?.getAttribute('data-align')).toBe('start')
  })
})
