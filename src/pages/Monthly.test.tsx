// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import Monthly from './Monthly.tsx'

afterEach(cleanup)

const show = () =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <Monthly />
      </TooltipProvider>
    </MemoryRouter>,
  )

const salary = () => screen.getByRole('textbox', { name: 'Basic salary per month' }) as HTMLInputElement
const bonus = () => screen.getByRole('textbox', { name: '13th month pay & bonuses' }) as HTMLInputElement
/** The payslip card only, so the phone bar and the tiles under it cannot satisfy a check by accident. */
const payslip = () => within(screen.getByRole('region', { name: /Payslip estimate/ }))
/** The big figure under a headline such as "Take-home pay per month". */
const headline = (label: string) => payslip().getByText(label).nextElementSibling?.textContent

describe('Monthly', () => {
  it('asks for a salary before showing a result', () => {
    show()
    expect(payslip().getByText('Your take-home pay')).toBeTruthy()
    expect(payslip().queryByText('Net pay')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Payslip' })).toBeNull()
  })

  it('shows the month for 35,000: take-home, tax, annual tax and the 15% bracket', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')
    expect(headline('Take-home pay per month')).toBe('₱30,473.75')
    expect(payslip().getByText('₱30,473.75')).toBeTruthy() // the net pay at the bottom
    expect(payslip().getByText('₱1,701.25')).toBeTruthy()
    expect(screen.getByText('₱20,415')).toBeTruthy()
    expect(screen.getByText(/is in the 15% bracket/)).toBeTruthy()
  })

  it('shows half of each line for a cutoff, and twelve months for the year', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')

    await user.click(screen.getByRole('radio', { name: 'Cutoff' }))
    expect(headline('Take-home pay per cutoff')).toBe('₱15,236.87')
    expect(payslip().getByText('₱15,236.87')).toBeTruthy()

    await user.click(screen.getByRole('radio', { name: 'Annual' }))
    expect(headline('Take-home pay per year')).toBe('₱365,685.00')
    expect(payslip().getByText('₱365,685.00')).toBeTruthy()
  })

  it('keeps the take-home in view on a phone, with a button to the payslip', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')
    expect(screen.getByRole('button', { name: 'Payslip' })).toBeTruthy()
  })

  it('takes no income tax from a minimum wage earner', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')
    await user.click(screen.getByRole('switch', { name: 'Minimum wage earner' }))
    // 35,000 less SSS 1,750, PhilHealth 875 and Pag-IBIG 200
    expect(headline('Take-home pay per month')).toBe('₱32,175.00')
    expect(payslip().getByText('₱32,175.00')).toBeTruthy()
  })

  it('has the 13th month follow the salary until something else is typed', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')
    expect(bonus().value).toBe('35,000')

    await user.clear(bonus())
    await user.type(bonus(), '90000')
    await user.type(salary(), '0')
    expect(salary().value).toBe('350,000')
    expect(bonus().value).toBe('90,000')

    // typing the same as the salary goes back to following it
    await user.clear(bonus())
    await user.type(bonus(), '350000')
    await user.type(salary(), '{backspace}')
    expect(bonus().value).toBe('35,000')
  })
  it('keeps a typed 13th month when the salary later becomes the same amount', async () => {
    const user = userEvent.setup()
    show()
    await user.type(salary(), '35000')
    await user.clear(bonus())
    await user.type(bonus(), '90000')

    await user.clear(salary())
    await user.type(salary(), '90000')
    await user.type(salary(), '0')
    expect(salary().value).toBe('900,000')
    expect(bonus().value).toBe('90,000')
  })
})
