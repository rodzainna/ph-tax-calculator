// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import BracketCard from './BracketCard.tsx'

afterEach(cleanup)

const show = (taxableIncome: number, year = 2026, caption?: string) =>
  render(
    <TooltipProvider>
      <BracketCard taxableIncome={taxableIncome} year={year} caption={caption} />
    </TooltipProvider>,
  )

/** The rate labels under the bar, in order. */
const rateLabels = (container: HTMLElement) => [...container.querySelectorAll('[aria-hidden] p.text-sm')]

describe('BracketCard', () => {
  it('names the rate of the bracket the income is in', () => {
    show(300_000)
    expect(screen.getByText('15% on the excess')).toBeTruthy()
  })

  it('says there is no income tax in the first bracket', () => {
    show(200_000)
    expect(screen.getByText('No income tax')).toBeTruthy()
  })

  it('shows the income with what it is', () => {
    show(300_000)
    expect(screen.getByText('₱300,000.00')).toBeTruthy()
    expect(screen.getByText('annual taxable income')).toBeTruthy()
  })

  it('says in words what the bar shows', () => {
    show(300_000)
    expect(screen.getByText('Your annual taxable income of ₱300,000.00 is in the 15% bracket.')).toBeTruthy()
  })

  it('uses the same name for the income in that sentence as it does on screen', () => {
    show(300_000, 2026, 'taxable pay')
    expect(screen.getByText('taxable pay')).toBeTruthy()
    expect(screen.getByText('Your taxable pay of ₱300,000.00 is in the 15% bracket.')).toBeTruthy()
    expect(screen.queryByText(/annual taxable income/)).toBeNull()
  })

  it('draws one segment for each bracket of the year', () => {
    const { container } = show(300_000)
    expect(rateLabels(container).map((p) => p.textContent)).toEqual(['0%', '15%', '20%', '25%', '30%', '35%'])
    for (const edge of ['≤250K', '≤400K', '≤800K', '≤2M', '≤8M', '>8M']) expect(screen.getByText(edge)).toBeTruthy()
  })

  it('marks only the bracket the income is in', () => {
    const { container } = show(300_000)
    const marked = rateLabels(container).filter((p) => p.className.includes('text-foreground'))
    expect(marked.map((p) => p.textContent)).toEqual(['15%'])
  })

  it('follows the tax table of the year', () => {
    show(3_000_000, 2022)
    expect(screen.getByText('32% on the excess')).toBeTruthy()
  })
})
