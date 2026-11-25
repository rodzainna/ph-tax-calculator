// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { formatPeso } from '@/lib/peso.ts'
import { fakeScreen } from '@/test/fakeScreen.ts'
import { moneyRows } from '@/test/moneyRows.ts'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import AnnualPreview from './AnnualPreview.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const show = () =>
  render(
    <TooltipProvider>
      <AnnualPreview />
    </TooltipProvider>,
  )

const chooseType = async (name: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('combobox', { name: 'I am' }))
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name }))
}

describe('AnnualPreview: who it is for', () => {
  it('starts with one employer and no business', () => {
    show()
    expect(screen.getByText('Employer #1')).toBeTruthy()
    expect(screen.queryByText('Business or freelance')).toBeNull()
  })

  it('shows only the business for someone self-employed', async () => {
    show()
    await chooseType('Self-employed')
    expect(screen.getByText('Business or freelance')).toBeTruthy()
    expect(screen.queryByText('Employer #1')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add another employer' })).toBeNull()
  })

  it('shows both for mixed income', async () => {
    show()
    await chooseType('Mixed income')
    expect(screen.getByText('Employer #1')).toBeTruthy()
    expect(screen.getByText('Business or freelance')).toBeTruthy()
  })

  it('keeps the employers when switching away and back', async () => {
    show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '5')
    await chooseType('Self-employed')
    await chooseType('Employee')
    expect((screen.getByRole('textbox', { name: 'Basic salary' }) as HTMLInputElement).value).toBe('5')
  })
})

describe('AnnualPreview: the estimate', () => {
  it('asks for a salary before there is an estimate', () => {
    show()
    expect(screen.getByText('Your tax for the year')).toBeTruthy()
  })

  it('works out the estimate from what is typed', async () => {
    const { container } = show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const rows = moneyRows(container.querySelector('.receipt') as HTMLElement)
    expect(rows['Regular pay']).toBe(formatPeso(600_000))
    expect(rows['Gross pay']).toBe(formatPeso(650_000))
  })

  it('shows the insights under the receipt once there is an estimate', async () => {
    show()
    const side = () => within(screen.getByRole('complementary'))
    expect(side().queryByText('Your tax bracket')).toBeNull()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    expect(side().getByText('Your tax bracket')).toBeTruthy()
  })

  // A month's contributions on 50,000 are 1,750 SSS, 1,250 PhilHealth and 200 Pag-IBIG: 38,400 a year.
  // 600,000 - 38,400 = 561,600 taxable, and the tax is 22,500 + 20% of 161,600 = 54,820.
  it('keeps the same figure in the bar for narrow screens', async () => {
    const { container } = show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const figureIn = (selector: string) => container.querySelector(selector)?.textContent
    expect(figureIn('.receipt p.text-4xl')).toBe(formatPeso(54_820))
    expect(figureIn('[data-summary-bar] [aria-live] > p:last-child')).toBe(formatPeso(54_820))
  })

  it('opens the same estimate from the bar', async () => {
    show()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(within(screen.getByRole('dialog')).getByText('Tax estimate · 2026')).toBeTruthy()
  })

  it('hands over to the side column when the screen widens with the bar details open', async () => {
    const screenWidth = fakeScreen()
    show()
    const user = userEvent.setup()
    const sideColumn = screen.getByRole('complementary', { name: 'Your estimate' })
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('button', { name: 'Details' }))
    screenWidth.resize(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(sideColumn))
  })

  it('fills in the employer summary beside the card', async () => {
    show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    const summary = screen.getByRole('group', { name: 'Summary Employer #1' })
    expect(moneyRows(summary)['Total pay']).toBe(formatPeso(650_000))
  })

  it('uses the tax year that was picked', async () => {
    const user = userEvent.setup()
    show()
    await user.type(screen.getByRole('textbox', { name: 'Basic salary' }), '50000')
    await user.click(screen.getByRole('combobox', { name: 'Tax year' }))
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: '2024' }))
    expect(screen.getByText('Tax estimate · 2024')).toBeTruthy()
  })

  it('counts the business income for someone self-employed', async () => {
    const { container } = show()
    await chooseType('Self-employed')
    const business = within(screen.getByText('Business or freelance').closest('[data-slot="card"]') as HTMLElement)
    await userEvent.setup().type(business.getByRole('textbox', { name: 'Amount' }), '50000')
    // The receipt and the business summary each have a "Gross receipts" row, so each is read on its own.
    const receipt = container.querySelector('.receipt') as HTMLElement
    expect(moneyRows(receipt)['Gross receipts']).toBe(formatPeso(600_000))
    expect(moneyRows(receipt)['Taxable income']).toBe(formatPeso(360_000))
    const summary = screen.getByRole('group', { name: 'Summary Business' })
    expect(moneyRows(summary)['Gross receipts']).toBe(formatPeso(600_000))
    expect(moneyRows(summary)['Net income']).toBe(formatPeso(360_000))
  })
})

describe('AnnualPreview: employers', () => {
  it('adds and removes an employer', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole('button', { name: 'Add another employer' }))
    expect(screen.getByText('Employer #2')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove employer #1' }))
    expect(screen.queryByText('Employer #2')).toBeNull()
    expect(screen.getByText('Employer #1')).toBeTruthy()
  })

  it('can remove an employer only when there is more than one', async () => {
    show()
    expect(screen.queryByRole('button', { name: /Remove employer/ })).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add another employer' }))
    expect(screen.getAllByRole('button', { name: /Remove employer/ })).toHaveLength(2)
  })

  it('shows the tax withheld typed in the summary in the employer card as well', async () => {
    show()
    const summary = within(screen.getByRole('group', { name: 'Summary Employer #1' }))
    await userEvent.setup().type(summary.getByRole('textbox', { name: 'Tax withheld' }), '1000')
    await userEvent.setup().click(screen.getByRole('button', { name: 'More' }))
    const fields = screen.getAllByRole('textbox', { name: 'Tax withheld' }) as HTMLInputElement[]
    expect(fields.map((f) => f.value)).toEqual(['1,000', '1,000'])
  })
})
