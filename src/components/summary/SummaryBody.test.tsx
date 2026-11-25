// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { formatPeso } from '@/lib/peso.ts'
import { annualResults, salaryJob } from '@/test/annualResults.ts'
import { moneyRows } from '@/test/moneyRows.ts'
import SummaryBody from './SummaryBody.tsx'

afterEach(cleanup)

const success = (result: AnnualReturnResult, notes: string[] = []): AnnualOutcome => ({
  ok: true,
  result,
  details: [],
  notes,
})

const show = (outcome: AnnualOutcome, assumption = 'Until Dec 31') =>
  render(
    <TooltipProvider>
      <SummaryBody outcome={outcome} assumption={assumption} />
    </TooltipProvider>,
  )

/** The big figure's paragraph, found through the live region that announces it. */
const figure = (container: HTMLElement) => container.querySelector('[aria-live] p.text-4xl') as HTMLElement | null

describe('SummaryBody: no estimate yet', () => {
  it('shows an empty state with just the title, when nothing is entered', () => {
    show({ ok: false, message: 'Add a basic salary', empty: true })
    expect(screen.getByText('Tax estimate')).toBeTruthy()
    expect(screen.getByText('Your tax for the year')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(/^Form /)).toBeNull()
  })

  it('says what is wrong, when there is a problem with what was entered', () => {
    show({ ok: false, message: 'Employer #1: the end date is before the start date.' })
    expect(screen.getByRole('alert').textContent).toBe('Employer #1: the end date is before the start date.')
    expect(screen.queryByText('Your tax for the year')).toBeNull()
  })

  it('shows no figure and no receipt', () => {
    const { container } = show({ ok: false, message: 'Something is off' })
    expect(figure(container)).toBeNull()
    expect(container.querySelector('dl')).toBeNull()
  })

  it('keeps the same live region when an estimate appears, so the figure is announced', () => {
    const empty: AnnualOutcome = { ok: false, message: '', empty: true }
    const { container, rerender } = show(empty)
    const region = container.querySelector('[aria-live]')
    expect(region).toBeTruthy()
    rerender(
      <TooltipProvider>
        <SummaryBody outcome={success(annualResults.employee())} assumption="Until Dec 31" />
      </TooltipProvider>,
    )
    expect(container.querySelector('[aria-live]')).toBe(region)
    expect(region?.textContent).toContain("You'd still owe")
  })
})

describe('SummaryBody: with an estimate', () => {
  it('names the year and the form', () => {
    show(success(annualResults.employee()))
    expect(screen.getByText('Tax estimate · 2026')).toBeTruthy()
    expect(screen.getByText('Form 1700')).toBeTruthy()
  })

  it.each([
    ['pay only', () => annualResults.employee(), 'Form 1700'],
    ['business only', () => annualResults.graduated({ grossReceipts: 600_000 }), 'Form 1701A'],
    ['both', () => annualResults.graduated({ grossReceipts: 600_000 }, [salaryJob]), 'Form 1701'],
  ])('shows the form for %s', (_name, result, form) => {
    show(success(result()))
    expect(screen.getByText(form)).toBeTruthy()
  })

  it('shows what is left to pay as the big figure, in red, with the assumption beside its label', () => {
    const result = annualResults.employee()
    const { container } = show(success(result), 'Until Dec 31')
    expect(screen.getByText("You'd still owe")).toBeTruthy()
    expect(screen.getByText('· Until Dec 31')).toBeTruthy()
    expect(figure(container)!.textContent).toBe(formatPeso(result.balance))
    expect(figure(container)!.className).toContain('text-destructive')
  })

  it('words the assumption as it was given', () => {
    show(success(annualResults.employee()), 'So far')
    expect(screen.getByText('· So far')).toBeTruthy()
  })

  it('draws the peso sign in the surrounding colour for a result to pay or overpaid, and in the brand colour for a plain tax', () => {
    const sign = (container: HTMLElement) => figure(container)!.querySelector('span span') as HTMLElement
    const owe = show(success(annualResults.employee()))
    expect(sign(owe.container).className).not.toContain('text-brand-gradient')
    cleanup()
    const plain = show(success(annualResults.employee({ ...salaryJob, taxWithheld: 0 })))
    expect(sign(plain.container).className).toContain('text-brand-gradient')
  })

  it('shows an overpayment in the primary colour', () => {
    const result = annualResults.employee({ ...salaryJob, taxWithheld: 500_000 })
    const { container } = show(success(result))
    expect(screen.getByText("You'd be overpaid by")).toBeTruthy()
    expect(figure(container)!.textContent).toBe(formatPeso(-result.balance))
    expect(figure(container)!.className).toContain('text-primary')
  })

  it('shows the whole tax, and asks for the tax withheld, when no credits are known', () => {
    const result = annualResults.employee({ ...salaryJob, taxWithheld: 0 })
    const { container } = show(success(result))
    expect(screen.getByText('Income tax')).toBeTruthy()
    expect(figure(container)!.textContent).toBe(formatPeso(result.totalTaxDue))
    expect(figure(container)!.className).toContain('text-foreground')
    expect(screen.getByText("Add tax withheld or paid to see what's left to pay.")).toBeTruthy()
  })

  it('does not ask for the tax withheld when no tax is due', () => {
    const result = annualResults.employee({
      ...salaryJob,
      regularPay: 200_000,
      thirteenthMonthAndBenefits: 0,
      taxWithheld: 0,
    })
    expect(result.totalTaxDue).toBe(0)
    show(success(result))
    expect(screen.queryByText(/Add tax withheld/)).toBeNull()
  })

  it('does not ask for the tax withheld once there are credits', () => {
    show(success(annualResults.employee()))
    expect(screen.queryByText(/Add tax withheld/)).toBeNull()
  })

  it('shows the receipt under the figure', () => {
    const { container } = show(success(annualResults.employee()))
    expect(Object.keys(moneyRows(container))).toEqual(expect.arrayContaining(['Total deductions', 'Credits']))
  })

  it('announces only the figure when it changes, not the whole receipt', () => {
    const { container } = show(success(annualResults.employee()))
    const live = container.querySelectorAll('[aria-live]')
    expect(live).toHaveLength(1)
    expect(live[0].textContent).toContain("You'd still owe")
    expect(live[0].textContent).not.toContain('Total deductions')
  })

  it('lists the notes about how the result was reached', () => {
    show(success(annualResults.employee(), ['De minimis benefits are treated as tax-free.', 'Another note.']))
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'De minimis benefits are treated as tax-free.',
      'Another note.',
    ])
  })

  it('has no list when there are no notes', () => {
    show(success(annualResults.employee()))
    expect(screen.queryByRole('list')).toBeNull()
  })
})
