// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AnnualReturnResult } from '@/engine/annualReturn.ts'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { formatPeso } from '@/lib/peso.ts'
import { annualResults, salaryJob } from '@/test/annualResults.ts'
import { fakeScreen } from '@/test/fakeScreen.ts'
import MobileSummaryBar from './MobileSummaryBar.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const success = (result: AnnualReturnResult): AnnualOutcome => ({ ok: true, result, details: [], notes: [] })

const withWithheld = (taxWithheld: number) => success(annualResults.employee({ ...salaryJob, taxWithheld }))

const show = (outcome: AnnualOutcome) => {
  const sideColumn = createRef<HTMLElement>()
  return render(
    <TooltipProvider>
      <aside ref={sideColumn} tabIndex={-1} />
      <MobileSummaryBar outcome={outcome} assumption="Until Dec 31" sideColumn={sideColumn} />
    </TooltipProvider>,
  )
}

/** What the bar says: the line above the figure, and the figure. */
const bar = (container: HTMLElement) => [...container.querySelectorAll('[aria-live] > p')].map((p) => p.textContent)

const openDetails = async () => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Details' }))
  return { user, sheet: screen.getByRole('dialog', { name: 'Your estimate' }) }
}

describe('MobileSummaryBar: the figure in view', () => {
  it.each([
    ['no tax is known to be paid', 0, 'Estimated income tax', 60_500],
    ['some is still owed', 50_000, "You'd still owe", 10_500],
    ['too much was paid', 70_000, "You'd be overpaid by", 9_500],
    ['all of it is paid', 60_500, 'Nothing left to pay', 0],
  ])('says so when %s', (_when, taxWithheld, label, amount) => {
    const { container } = show(withWithheld(taxWithheld))
    expect(bar(container)).toEqual([label, formatPeso(amount)])
  })

  it('shows a dash before anything is entered', () => {
    const { container } = show({ ok: false, message: 'Add a basic salary', empty: true })
    expect(bar(container)).toEqual(['Estimate', '—'])
  })

  it('says to check the entries when one is wrong, since the message itself is out of view', () => {
    const { container } = show({ ok: false, message: 'Something is off' })
    expect(bar(container)).toEqual(['Check your entries', '—'])
  })
})

describe('MobileSummaryBar: on the page', () => {
  it('announces the figure together with what it is', () => {
    const { container } = show(withWithheld(50_000))
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live.getAttribute('aria-atomic')).toBe('true')
    expect(live.textContent).toBe("You'd still owe₱10,500.00")
  })

  it('is marked, so the page can keep focused fields above it', () => {
    const { container } = show(withWithheld(50_000))
    expect(container.querySelector('[data-summary-bar]')).toBeTruthy()
  })
})

describe('MobileSummaryBar: the details', () => {
  it('keeps the working closed until asked for', () => {
    show(withWithheld(50_000))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Form 1700')).toBeNull()
  })

  it('shows the receipt and the insights', async () => {
    show(withWithheld(50_000))
    const { sheet } = await openDetails()
    expect(within(sheet).getByText('Form 1700')).toBeTruthy()
    expect(within(sheet).getByText('· Until Dec 31')).toBeTruthy()
    expect(within(sheet).getByText('Your tax bracket')).toBeTruthy()
  })

  it('shows what is wrong with an entry', async () => {
    show({ ok: false, message: 'Something is off' })
    const { sheet } = await openDetails()
    expect(within(sheet).getByRole('alert').textContent).toBe('Something is off')
  })

  it('focuses the sheet itself, so no tip opens over the figure', async () => {
    show(withWithheld(50_000))
    const { sheet } = await openDetails()
    expect(document.activeElement).toBe(sheet)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('closes again and gives the focus back', async () => {
    show(withWithheld(50_000))
    const { user, sheet } = await openDetails()
    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Details' }))
  })
})

describe('MobileSummaryBar: when the screen widens to the side column', () => {
  it('closes the details and moves the focus to that column', async () => {
    const screenWidth = fakeScreen()
    show(withWithheld(50_000))
    await openDetails()
    screenWidth.resize(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('complementary')))
  })

  it('stays open through a change that leaves the screen narrow', async () => {
    const screenWidth = fakeScreen()
    show(withWithheld(50_000))
    const { sheet } = await openDetails()
    screenWidth.resize(false)
    expect(screen.getByRole('dialog')).toBe(sheet)
  })

  it('still gives the focus back to Details when closed on a narrow screen', async () => {
    fakeScreen()
    show(withWithheld(50_000))
    const { user, sheet } = await openDetails()
    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Details' })))
  })

  it('watches the screen only while the details are open', async () => {
    const screenWidth = fakeScreen()
    show(withWithheld(50_000))
    expect(screenWidth.listeners.size).toBe(0)
    const { user, sheet } = await openDetails()
    expect(screenWidth.listeners.size).toBe(1)
    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    expect(screenWidth.listeners.size).toBe(0)
  })
})
