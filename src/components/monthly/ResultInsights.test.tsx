// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { monthlyPay } from '@/engine/monthlyPay.ts'
import ResultInsights from './ResultInsights.tsx'

beforeEach(() => {
  // Radix measures an open tip with a ResizeObserver, which jsdom does not have.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const show = () =>
  render(
    <TooltipProvider>
      <ResultInsights
        result={monthlyPay({ year: 2026, monthlyBasic: 50_000 })}
        year={2026}
        taxpayer={{ type: 'employee', method: 'graduated' }}
      />
    </TooltipProvider>,
  )

describe('ResultInsights', () => {
  it('shows the three figures for a salary', () => {
    show()
    for (const label of ['Annual tax', 'Effective rate', 'Bonus tax']) {
      expect(screen.getByRole('button', { name: `More about ${label}` })).toBeTruthy()
    }
  })

  it('explains the bonus tax with the exempt amount', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'More about Bonus tax' }))
    expect(screen.getByRole('tooltip').textContent).toBe(
      'Extra tax caused by the part of your 13th month and bonuses above the ₱90,000.00 exempt amount. It is zero while they stay under it.',
    )
  })
})
