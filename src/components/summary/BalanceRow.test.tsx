// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { formatPeso } from '@/lib/peso.ts'
import BalanceRow from './BalanceRow.tsx'

afterEach(cleanup)

const show = (balance: number) =>
  render(
    <TooltipProvider>
      <BalanceRow balance={balance} />
    </TooltipProvider>,
  )

const box = (container: HTMLElement) => container.querySelector('dl > div') as HTMLElement

describe('BalanceRow', () => {
  it('says what is left to pay, in the pink box', () => {
    const { container } = show(12_345.67)
    expect(screen.getByText('To pay')).toBeTruthy()
    expect(container.textContent).toContain(formatPeso(12_345.67))
    expect(box(container).className).toContain('bg-secondary')
    expect(screen.getByRole('button', { name: 'More about what is left to pay' })).toBeTruthy()
  })

  it('says overpaid, with the amount shown without a minus sign, in the teal box', () => {
    const { container } = show(-8_000)
    expect(screen.getByText('Overpaid')).toBeTruthy()
    expect(container.textContent).toContain(formatPeso(8_000))
    expect(container.textContent).not.toContain('-')
    expect(box(container).className).toContain('bg-accent')
    expect(screen.getByRole('button', { name: 'More about the overpayment' })).toBeTruthy()
  })

  it('shows nothing to pay in the grey box when the balance is zero', () => {
    const { container } = show(0)
    expect(screen.getByText('To pay')).toBeTruthy()
    expect(container.textContent).toContain(formatPeso(0))
    expect(box(container).className).toContain('bg-muted')
  })
})
