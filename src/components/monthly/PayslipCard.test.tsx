// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { initialMonthlyForm, monthlyOutcome, type MonthlyInput } from '@/lib/monthlyOutcome.ts'
import type { Taxpayer } from '@/lib/taxpayer.ts'
import PayslipCard from './PayslipCard.tsx'

afterEach(cleanup)

const EMPLOYEE: Taxpayer = { type: 'employee', method: 'graduated' }
const SELF_EMPLOYED: Taxpayer = { type: 'self-employed', method: 'graduated' }

const card = (taxpayer: Taxpayer, basic = '35000', typed: Partial<MonthlyInput> = {}) => (
  <MemoryRouter>
    <TooltipProvider>
      <PayslipCard
        year={2026}
        outcome={monthlyOutcome({ ...initialMonthlyForm(2026), taxpayer, basic, bonus: basic, ...typed })}
        taxpayer={taxpayer}
        minimumWage={typed.minimumWage ?? false}
      />
    </TooltipProvider>
  </MemoryRouter>
)

const DE_MINIMIS_NOTE =
  "Non-taxable allowances are treated as fully tax-free. This app doesn't check them against the legal limits for de minimis benefits, so your tax could be higher than shown."

const period = () => screen.getByRole('radio', { checked: true }).textContent

describe('PayslipCard', () => {
  it('offers a cutoff to an employee, and shows it when chosen', async () => {
    const user = userEvent.setup()
    render(card(EMPLOYEE))
    await user.click(screen.getByRole('radio', { name: 'Cutoff' }))
    expect(period()).toBe('Cutoff')
    // once as the headline and once on the phone bar
    expect(screen.getAllByText('Take-home pay per cutoff')).toHaveLength(2)
  })

  it('has no cutoff for the self-employed, and falls back to the month if one was chosen', async () => {
    const user = userEvent.setup()
    const { rerender } = render(card(EMPLOYEE))
    await user.click(screen.getByRole('radio', { name: 'Cutoff' }))

    rerender(card(SELF_EMPLOYED))
    expect(screen.queryByRole('radio', { name: 'Cutoff' })).toBeNull()
    expect(period()).toBe('Monthly')
    expect(screen.getAllByText('Take-home income per month')).toHaveLength(2)
  })

  it('keeps the annual view when switching to the self-employed', async () => {
    const user = userEvent.setup()
    const { rerender } = render(card(EMPLOYEE))
    await user.click(screen.getByRole('radio', { name: 'Annual' }))
    rerender(card(SELF_EMPLOYED))
    expect(period()).toBe('Annual')
  })

  it.each([
    ['35000', 'text-2xl'],
    ['999999999', 'text-xl'],
  ])("sizes the year's net pay row for a monthly salary of %s with %s", async (basic, size) => {
    render(card(EMPLOYEE, basic))
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Annual' }))
    const amount = screen.getByText('Net pay').nextElementSibling as HTMLElement
    expect(amount.classList.contains(size)).toBe(true)
  })

  it.each(['Monthly', 'Cutoff', 'Annual'])(
    'says the legal limits on non-taxable allowances are not checked, in the %s view',
    async (view) => {
      render(card(EMPLOYEE, '35000', { deMinimis: '2000' }))
      await userEvent.setup().click(screen.getByRole('radio', { name: view }))
      expect(screen.getByText(DE_MINIMIS_NOTE)).toBeTruthy()
    },
  )

  it.each<[string, Taxpayer, Partial<MonthlyInput>]>([
    ['no non-taxable allowance is typed', EMPLOYEE, { deMinimis: '' }],
    ['the non-taxable allowance is zero', EMPLOYEE, { deMinimis: '0' }],
    ['an amount is left over from before switching to self-employed', SELF_EMPLOYED, { deMinimis: '2000' }],
    ['all the pay of a minimum wage earner is already exempt', EMPLOYEE, { deMinimis: '2000', minimumWage: true }],
  ])('has no note about legal limits when %s', (_case, taxpayer, typed) => {
    render(card(taxpayer, '35000', typed))
    expect(screen.getByText(/^Net (pay|income)$/)).toBeTruthy()
    expect(screen.queryByText(DE_MINIMIS_NOTE)).toBeNull()
  })

  it('keeps the warning about contributions above the pay ahead of the note about legal limits', () => {
    render(card(EMPLOYEE, '100', { deMinimis: '1', bonus: '' }))
    const warning = screen.getByText(/SSS and PhilHealth have minimum contributions/)
    const note = screen.getByText(DE_MINIMIS_NOTE)
    expect(warning.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows what went wrong instead of a payslip', () => {
    render(card(EMPLOYEE, '35,000x'))
    expect(screen.getByText('One of the amounts is not a valid number.')).toBeTruthy()
    expect(screen.queryByText('Net pay')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Payslip' })).toBeNull()
  })
})
