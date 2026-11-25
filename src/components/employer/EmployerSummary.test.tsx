// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { EmployerDetail } from '@/lib/computeScenario.ts'
import { formatPeso } from '@/lib/peso.ts'
import { newEmployer, type EmployerState } from '@/lib/yearForm.ts'
import EmployerSummary from './EmployerSummary.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const employer = (over: Partial<EmployerState> = {}): EmployerState => ({ ...newEmployer(1, 2), ...over })

// Every figure is different, so a row showing another row's number is caught.
const detail = (over: Partial<EmployerDetail> = {}): EmployerDetail => ({
  name: 'Employer #1',
  totalPay: 600_000,
  monthsToDate: 6,
  monthsCounted: 12,
  annualBasic: 500_000,
  thirteenthOwed: 50_000,
  thirteenthCounted: 40_000,
  deMinimisYear: 0,
  contributions: { sss: 1_111, philhealth: 2_222, pagibig: 3_333, total: 6_666, estimated: true },
  taxWithheld: 9_999,
  ...over,
})

type Props = Partial<React.ComponentProps<typeof EmployerSummary>>

const show = (props: Props = {}) => {
  const onTaxWithheldChange = vi.fn()
  const view = render(
    <TooltipProvider>
      <EmployerSummary
        index={0}
        employer={employer()}
        detail={detail()}
        onTaxWithheldChange={onTaxWithheldChange}
        {...props}
      />
    </TooltipProvider>,
  )
  return { onTaxWithheldChange, ...view }
}

/** The label and amount of each row, such as `{ SSS: '₱1,111.00' }`. */
const rows = (container: HTMLElement): Record<string, string | null> =>
  Object.fromEntries(
    [...container.querySelectorAll('dt')].map((term) => [
      term.textContent,
      term.nextElementSibling?.textContent ?? null,
    ]),
  )

describe('EmployerSummary: the figures', () => {
  it('is numbered from the position of its employer', () => {
    show({ index: 2 })
    expect(screen.getByText('Summary Employer #3')).toBeTruthy()
  })

  it('shows the months counted', () => {
    show({ detail: detail({ monthsCounted: 6.5 }) })
    expect(screen.getByText('6.5 months')).toBeTruthy()
  })

  it('gives each row its own figure, with the contributions in the order of the payslip', () => {
    const { container } = show()
    expect(rows(container)).toEqual({
      'Total pay': formatPeso(600_000),
      '13th month': formatPeso(50_000),
      SSS: formatPeso(1_111),
      PhilHealth: formatPeso(2_222),
      'Pag-IBIG': formatPeso(3_333),
    })
  })

  it('shows dashes and no months while there are no figures yet', () => {
    const { container } = show({ detail: undefined })
    expect(Object.values(rows(container))).toEqual(['—', '—', '—', '—', '—'])
    expect(screen.queryByText(/months$/)).toBeNull()
  })
})

describe('EmployerSummary: the 13th month', () => {
  it('shows what is owed from the salary, not the amount counted', () => {
    const { container } = show({ employer: employer({ thirteenthMode: 'custom' }) })
    expect(rows(container)['13th month']).toBe(formatPeso(50_000))
  })

  it('says it is not counted when it is unpaid', () => {
    show({ employer: employer({ thirteenthMode: 'unpaid' }) })
    expect(screen.getByText('Not counted (unpaid)')).toBeTruthy()
  })

  it('has no note when it is counted', () => {
    show({ employer: employer({ thirteenthMode: 'estimate' }) })
    expect(screen.queryByText('Not counted (unpaid)')).toBeNull()
  })

  it('shows what was entered when the pay comes from a payslip', () => {
    const { container } = show({
      employer: employer({ mode: 'ytd' }),
      detail: detail({ thirteenthOwed: null, thirteenthCounted: 20_000 }),
    })
    expect(rows(container)['13th month']).toBe(formatPeso(20_000))
  })

  it('shows nothing counted when none was entered on a payslip', () => {
    const { container } = show({
      employer: employer({ mode: 'ytd' }),
      detail: detail({ thirteenthOwed: null, thirteenthCounted: 0 }),
    })
    expect(rows(container)['13th month']).toBe(formatPeso(0))
  })

  it('does not call a payslip 13th month unpaid, because that choice is only for a salary', () => {
    show({ employer: employer({ mode: 'ytd', thirteenthMode: 'unpaid' }), detail: detail({ thirteenthOwed: null }) })
    expect(screen.queryByText('Not counted (unpaid)')).toBeNull()
  })
})

describe('EmployerSummary: tax withheld', () => {
  it('shows the value saved on the employer', () => {
    show({ employer: employer({ taxWithheld: '12,345' }) })
    expect((screen.getByRole('textbox', { name: 'Tax withheld' }) as HTMLInputElement).value).toBe('12,345')
  })

  it('reports what is typed', async () => {
    const { onTaxWithheldChange } = show()
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Tax withheld' }), '5')
    expect(onTaxWithheldChange).toHaveBeenCalledWith('5')
  })

  it('can be told apart from the same field in another employer summary', () => {
    render(
      <TooltipProvider>
        <EmployerSummary
          index={0}
          employer={employer({ taxWithheld: '1' })}
          detail={detail()}
          onTaxWithheldChange={vi.fn()}
        />
        <EmployerSummary
          index={1}
          employer={employer({ id: 3, taxWithheld: '2' })}
          detail={detail()}
          onTaxWithheldChange={vi.fn()}
        />
      </TooltipProvider>,
    )
    const second = within(screen.getByRole('group', { name: 'Summary Employer #2' }))
    expect((second.getByRole('textbox', { name: 'Tax withheld' }) as HTMLInputElement).value).toBe('2')
  })

  it('shows the projected figure under the field when it differs from what was typed', () => {
    show({ employer: employer({ taxWithheld: '5,000' }), detail: detail({ taxWithheld: 10_000, monthsToDate: 6.5 }) })
    expect(screen.getByText(/Projected to Dec 31:/).textContent).toContain(formatPeso(10_000))
    expect(screen.getByRole('button', { name: 'More about the projected tax withheld' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'More about Tax withheld' })).toBeNull()
  })

  it('projects to the end date, not Dec 31, when the job has one', () => {
    show({
      employer: employer({ taxWithheld: '5,000', endDate: '2026-10-31' }),
      detail: detail({ taxWithheld: 8_000 }),
    })
    expect(screen.getByText(/Projected to the end date:/).textContent).toContain(formatPeso(8_000))
    expect(screen.queryByText(/Projected to Dec 31/)).toBeNull()
  })

  it('says in the tip how many months the typed figure covers', async () => {
    // A tip is placed with a ResizeObserver, which jsdom does not have.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    show({
      employer: employer({ taxWithheld: '5,000' }),
      detail: detail({ taxWithheld: 10_000, monthsToDate: 6.5, monthsCounted: 12 }),
    })
    // A plain click: moving a pointer over the button first opens the tip after a delay, and the click then closes it.
    fireEvent.click(screen.getByRole('button', { name: 'More about the projected tax withheld' }))
    expect((await screen.findAllByText(/withheld so far this year \(6\.5 months\)/)).length).toBeGreaterThan(0)
  })

  it('shows no projection when it is the same as what was typed, and explains the field in a tip instead', () => {
    show({ employer: employer({ taxWithheld: '9,999' }), detail: detail({ taxWithheld: 9_999 }) })
    expect(screen.queryByText(/Projected to Dec 31/)).toBeNull()
    expect(screen.getByRole('button', { name: 'More about Tax withheld' })).toBeTruthy()
  })

  it('shows no projection when nothing is typed', () => {
    show({ employer: employer({ taxWithheld: '' }), detail: detail({ taxWithheld: 0 }) })
    expect(screen.queryByText(/Projected to Dec 31/)).toBeNull()
  })
})
