// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import MoneyRow from './MoneyRow.tsx'

afterEach(cleanup)

const wrap = (ui: React.ReactElement) => (
  <TooltipProvider>
    <dl>{ui}</dl>
  </TooltipProvider>
)
const inList = (ui: React.ReactElement) => render(wrap(ui))

describe('MoneyRow', () => {
  it('shows the amount as pesos', () => {
    inList(<MoneyRow label="Gross pay" amount={35_000} />)
    expect(screen.getByText('₱35,000.00')).toBeTruthy()
  })

  it('shows a dash when there is no amount yet', () => {
    inList(<MoneyRow label="Gross pay" amount={null} />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('reads the sign out loud and shows it as a symbol', () => {
    inList(<MoneyRow label="SSS" amount={1_750} sign="minus" tone="deduction" />)
    expect(screen.getByText('minus', { exact: false })).toBeTruthy()
    expect(screen.getByText('−')).toBeTruthy()
  })

  it('plays a zero down, but not on a bold row', () => {
    const { rerender } = inList(<MoneyRow label="Tax" amount={0} />)
    expect(screen.getByText('₱0.00').className).toContain('text-muted-foreground/60')
    rerender(wrap(<MoneyRow strong label="Tax" amount={0} />))
    expect(screen.getByText('₱0.00').className).not.toContain('text-muted-foreground/60')
  })

  it('draws a deduction in red, fading a zero unless the row is bold', () => {
    const { rerender } = inList(<MoneyRow label="SSS" amount={1_111} tone="deduction" />)
    expect(screen.getByText('₱1,111.00').classList).toContain('text-destructive')

    rerender(wrap(<MoneyRow label="SSS" amount={0} tone="deduction" />))
    expect(screen.getByText('₱0.00').classList).toContain('text-destructive/45')
    expect(screen.getByText('₱0.00').classList).not.toContain('text-muted-foreground/60')

    rerender(wrap(<MoneyRow strong label="SSS" amount={0} tone="deduction" />))
    expect(screen.getByText('₱0.00').classList).toContain('text-destructive')
  })

  it('puts the term and its amount directly in the list, as a description list needs', () => {
    const { container } = inList(<MoneyRow label="Gross pay" amount={1} note="a note" />)
    const row = container.querySelector('dl > div')!
    expect([...row.children].map((c) => c.tagName)).toEqual(['DT', 'DD', 'DD'])
  })

  it('names the tip button after the label', () => {
    inList(<MoneyRow label="Gross pay" amount={1} hint="Before deductions." />)
    expect(screen.getByRole('button', { name: 'More about Gross pay' })).toBeTruthy()
  })
})
