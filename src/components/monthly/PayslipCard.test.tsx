// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { initialMonthlyForm, monthlyOutcome } from '@/lib/monthlyOutcome.ts'
import type { Taxpayer } from '@/lib/taxpayer.ts'
import PayslipCard from './PayslipCard.tsx'

afterEach(cleanup)

const EMPLOYEE: Taxpayer = { type: 'employee', method: 'graduated' }
const SELF_EMPLOYED: Taxpayer = { type: 'self-employed', method: 'graduated' }

const card = (taxpayer: Taxpayer, basic = '35000') => (
  <MemoryRouter>
    <TooltipProvider>
      <PayslipCard
        year={2026}
        outcome={monthlyOutcome({ ...initialMonthlyForm(2026), taxpayer, basic, bonus: basic })}
        taxpayer={taxpayer}
        minimumWage={false}
      />
    </TooltipProvider>
  </MemoryRouter>
)

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

  it('shows what went wrong instead of a payslip', () => {
    render(card(EMPLOYEE, '35,000x'))
    expect(screen.getByText('One of the amounts is not a valid number.')).toBeTruthy()
    expect(screen.queryByText('Net pay')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Payslip' })).toBeNull()
  })
})
