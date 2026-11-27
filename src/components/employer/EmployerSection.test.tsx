// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { stubRadixDomApis } from '@/test/radixStubs.ts'
import { newEmployer, type EmployerState } from '@/lib/yearForm.ts'
import EmployerSection from './EmployerSection.tsx'

let restoreDom: () => void
beforeAll(() => {
  restoreDom = stubRadixDomApis()
})
afterAll(() => restoreDom())
afterEach(cleanup)

const employer = (over: Partial<EmployerState> = {}): EmployerState => ({ ...newEmployer(1, 2), ...over })

const show = (e: EmployerState = employer(), props: Partial<React.ComponentProps<typeof EmployerSection>> = {}) => {
  const onChange = vi.fn()
  const onRemove = vi.fn()
  const nextLineId = vi.fn(() => 77)
  render(
    <TooltipProvider>
      <EmployerSection
        employer={e}
        year={2026}
        asOf="2026-06-15"
        index={0}
        canRemove={false}
        nextLineId={nextLineId}
        onChange={onChange}
        onRemove={onRemove}
        {...props}
      />
    </TooltipProvider>,
  )
  return { onChange, onRemove, nextLineId }
}

const box = (name: string) => screen.getByRole('textbox', { name }) as HTMLInputElement
const openMore = async () => await userEvent.setup().click(screen.getByRole('button', { name: 'More' }))

describe('EmployerSection: the card', () => {
  it('is numbered from the position it has in the list', () => {
    show(employer(), { index: 2 })
    expect(screen.getByText('Employer #3')).toBeTruthy()
  })

  it('shows the same number in the round badge as in the title', () => {
    show(employer(), { index: 2 })
    expect(screen.getByText('3', { selector: 'span' })).toBeTruthy()
  })

  it('offers removal only when it is allowed, and reports it', async () => {
    const { onRemove } = show(employer(), { canRemove: true, index: 1 })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove employer #2' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    cleanup()
    show(employer(), { canRemove: false })
    expect(screen.queryByRole('button', { name: /Remove employer/ })).toBeNull()
  })

  it('switches between a salary and a payslip, and reports the change with the rest kept', async () => {
    const e = employer({ basic: '30000' })
    const { onChange } = show(e)
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Payslip to date' }))
    expect(onChange).toHaveBeenCalledWith({ ...e, mode: 'ytd' })
  })

  it('reports a date change merged into the employer', () => {
    const e = employer({ basic: '30000' })
    const { onChange } = show(e)
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
    expect(onChange).toHaveBeenCalledWith({ ...e, startDate: '2026-03-01' })
  })
})

describe('EmployerSection: salary mode', () => {
  it('shows the salary, how often it is paid, the dates, de minimis and the More tray, but not the payslip fields', () => {
    show()
    expect(box('Basic salary')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Paid' }).textContent).toBe('Monthly')
    expect(screen.getByLabelText('From')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'De minimis benefits' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: 'Taxable gross' })).toBeNull()
  })

  it('reports a typed salary', async () => {
    const e = employer()
    const { onChange } = show(e)
    await userEvent.setup().type(box('Basic salary'), '5')
    expect(onChange).toHaveBeenCalledWith({ ...e, basic: '5' })
  })

  it('reports how often the salary is paid', async () => {
    const user = userEvent.setup()
    const e = employer({ basic: '30000' })
    const { onChange } = show(e)
    await user.click(screen.getByRole('combobox', { name: 'Paid' }))
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Twice a month' }))
    // The blank benefit row follows, since twice-a-month pay comes in cutoffs.
    expect(onChange).toHaveBeenCalledWith({
      ...e,
      frequency: 'semi-monthly',
      deMinimis: [{ ...e.deMinimis[0]!, per: 'payout' }],
    })
  })

  it('shows the benefit rows only when de minimis is on', async () => {
    const e = employer()
    const { onChange } = show(e)
    expect(screen.queryByRole('button', { name: 'Add another benefit' })).toBeNull()
    await userEvent.setup().click(screen.getByRole('switch', { name: 'De minimis benefits' }))
    expect(onChange).toHaveBeenCalledWith({ ...e, hasDeMinimis: true })
    cleanup()
    show(employer({ hasDeMinimis: true }))
    expect(screen.getByRole('button', { name: 'Add another benefit' })).toBeTruthy()
  })

  it('turns de minimis off, with a fresh blank benefit kept for later, when the last one is removed', async () => {
    const e = employer({ hasDeMinimis: true, deMinimis: [{ id: 5, label: 'Rice', amount: '1000', per: 'month' }] })
    const { onChange, nextLineId } = show(e)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove this benefit and turn de minimis off' }))
    expect(nextLineId).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      ...e,
      hasDeMinimis: false,
      deMinimis: [{ id: 77, label: '', amount: '', per: 'month' }],
    })
  })
})

describe('EmployerSection: the More tray in salary mode', () => {
  it('holds the 13th month choice, tax withheld, other pay and bonuses', async () => {
    const e = employer()
    const { onChange } = show(e)
    await openMore()
    expect(screen.getByRole('radiogroup', { name: '13th month' })).toBeTruthy()
    await userEvent.setup().type(box('Tax withheld'), '9')
    expect(onChange).toHaveBeenLastCalledWith({ ...e, taxWithheld: '9' })
    await userEvent.setup().type(box('Other pay'), '8')
    expect(onChange).toHaveBeenLastCalledWith({ ...e, otherPay: '8' })
    await userEvent.setup().type(box('Bonuses'), '7')
    expect(onChange).toHaveBeenLastCalledWith({ ...e, otherBenefits: '7' })
  })

  it('shows each field its own saved value', async () => {
    show(
      employer({
        taxWithheld: '2',
        otherPay: '6',
        otherBenefits: '7',
        thirteenthMode: 'custom',
        thirteenthCustom: '8',
      }),
    )
    await openMore()
    expect([box('Tax withheld').value, box('Other pay').value, box('Bonuses').value]).toEqual(['2', '6', '7'])
    expect(box('13th month received').value).toBe('8')
  })

  it('reports the 13th month choice', async () => {
    const e = employer()
    const { onChange } = show(e)
    await openMore()
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Not paid yet' }))
    expect(onChange).toHaveBeenCalledWith({ ...e, thirteenthMode: 'unpaid' })
  })

  it('switches contributions to hand-entered, and back to estimated', async () => {
    const user = userEvent.setup()
    const e = employer()
    const first = show(e)
    await openMore()
    expect(screen.queryByRole('textbox', { name: 'SSS' })).toBeNull()
    await user.click(screen.getByRole('switch', { name: 'Enter SSS, PhilHealth, Pag-IBIG myself' }))
    expect(first.onChange).toHaveBeenCalledWith({ ...e, contributionsMode: 'custom' })
    cleanup()

    const custom = employer({ contributionsMode: 'custom' })
    const second = show(custom)
    await openMore()
    for (const name of ['SSS', 'PhilHealth', 'Pag-IBIG']) expect(box(name)).toBeTruthy()
    await user.click(screen.getByRole('switch', { name: 'Enter SSS, PhilHealth, Pag-IBIG myself' }))
    expect(second.onChange).toHaveBeenCalledWith({ ...custom, contributionsMode: 'estimate' })
  })
})

describe('EmployerSection: payslip mode', () => {
  const payslip = () => employer({ mode: 'ytd' })

  it('asks for the year-to-date figures instead of a salary, and has no de minimis or More tray', () => {
    show(payslip())
    for (const name of [
      'Taxable gross',
      'Tax withheld',
      'SSS',
      'PhilHealth',
      'Pag-IBIG',
      'Other pay',
      'Bonuses',
      '13th month',
    ]) {
      expect(box(name)).toBeTruthy()
    }
    expect(screen.queryByRole('textbox', { name: 'Basic salary' })).toBeNull()
    expect(screen.queryByRole('switch', { name: 'De minimis benefits' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull()
    expect(screen.getByLabelText('From')).toBeTruthy()
  })

  it('shows each field its own saved value', () => {
    show(
      employer({
        mode: 'ytd',
        ytdTaxableGross: '1',
        taxWithheld: '2',
        ytdSss: '3',
        ytdPhilhealth: '4',
        ytdPagibig: '5',
        otherPay: '6',
        otherBenefits: '7',
        thirteenthCustom: '8',
      }),
    )
    const shown = [
      'Taxable gross',
      'Tax withheld',
      'SSS',
      'PhilHealth',
      'Pag-IBIG',
      'Other pay',
      'Bonuses',
      '13th month',
    ].map((name) => box(name).value)
    expect(shown).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
  })

  it('groups the fields under what they come from', () => {
    show(payslip())
    expect(screen.getByText('From your payslip')).toBeTruthy()
    expect(screen.getByText('Also received')).toBeTruthy()
  })

  it('reports each figure into its own field', async () => {
    const user = userEvent.setup()
    const e = payslip()
    const { onChange } = show(e)
    const fields: Array<[string, keyof EmployerState]> = [
      ['Taxable gross', 'ytdTaxableGross'],
      ['Tax withheld', 'taxWithheld'],
      ['SSS', 'ytdSss'],
      ['PhilHealth', 'ytdPhilhealth'],
      ['Pag-IBIG', 'ytdPagibig'],
      ['Other pay', 'otherPay'],
      ['Bonuses', 'otherBenefits'],
      ['13th month', 'thirteenthCustom'],
    ]
    for (const [name, key] of fields) {
      await user.type(box(name), '4')
      expect(onChange).toHaveBeenLastCalledWith({ ...e, [key]: '4' })
    }
  })
})
