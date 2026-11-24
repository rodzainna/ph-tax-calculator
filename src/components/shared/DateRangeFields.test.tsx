// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DateRangeFields from './DateRangeFields.tsx'

afterEach(cleanup)

const show = (props: Partial<React.ComponentProps<typeof DateRangeFields>> = {}) => {
  const onChange = vi.fn()
  render(
    <DateRangeFields
      idSuffix="1"
      year={2026}
      asOf="2026-06-15"
      startDate=""
      endDate=""
      onChange={onChange}
      openEndedLabel="Still working"
      {...props}
    />,
  )
  return onChange
}

const from = () => screen.getByLabelText('From') as HTMLInputElement
const to = () => screen.getByLabelText('To') as HTMLInputElement
const stillWorking = () => screen.getByRole('switch', { name: 'Still working' })

describe('DateRangeFields', () => {
  it('shows a blank start as January 1 of the year', () => {
    show({ year: 2025 })
    expect(from().value).toBe('2025-01-01')
  })

  it('shows a blank end as "Present", in a field the To label belongs to', () => {
    show()
    expect(to().value).toBe('Present')
    expect(to().readOnly).toBe(true)
    expect(stillWorking().getAttribute('aria-checked')).toBe('true')
  })

  it('shows a typed end date and has the switch off', () => {
    show({ endDate: '2026-09-30' })
    expect(to().value).toBe('2026-09-30')
    expect(stillWorking().getAttribute('aria-checked')).toBe('false')
  })

  it('does not save a start or end date outside the tax year', () => {
    const onChange = show({ endDate: '2026-09-30' })
    fireEvent.change(from(), { target: { value: '2025-03-01' } })
    fireEvent.change(to(), { target: { value: '2027-02-01' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(from().min).toBe('2026-01-01')
    expect(from().max).toBe('2026-12-31')
    expect(to().min).toBe('2026-01-01')
    expect(to().max).toBe('2026-12-31')
  })

  it('saves a new start date', () => {
    const onChange = show()
    fireEvent.change(from(), { target: { value: '2026-03-01' } })
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-03-01' })
  })

  it('saves January 1 as a blank start', () => {
    const onChange = show({ startDate: '2026-03-01' })
    fireEvent.change(from(), { target: { value: '2026-01-01' } })
    expect(onChange).toHaveBeenCalledWith({ startDate: '' })
  })

  it('saves a new end date', () => {
    const onChange = show({ endDate: '2026-09-30' })
    fireEvent.change(to(), { target: { value: '2026-10-31' } })
    expect(onChange).toHaveBeenCalledWith({ endDate: '2026-10-31' })
  })

  it('starts the end date at the counted-to date when the switch is turned off', async () => {
    const onChange = show()
    await userEvent.setup().click(stillWorking())
    expect(onChange).toHaveBeenCalledWith({ endDate: '2026-06-15' })
  })

  it('starts the end date at December 31 for another year, and not before the start', async () => {
    const user = userEvent.setup()
    const past = show({ year: 2025 })
    await user.click(stillWorking())
    expect(past).toHaveBeenCalledWith({ endDate: '2025-12-31' })
    cleanup()
    const late = show({ startDate: '2026-08-01', asOf: '2026-06-15' })
    await user.click(stillWorking())
    expect(late).toHaveBeenCalledWith({ endDate: '2026-08-01' })
  })

  it('clears the end date when the switch is turned back on', async () => {
    const onChange = show({ endDate: '2026-09-30' })
    await userEvent.setup().click(stillWorking())
    expect(onChange).toHaveBeenCalledWith({ endDate: '' })
  })

  it('uses the suffix to keep the ids apart for each employer', () => {
    show({ idSuffix: 7 })
    expect(from().id).toBe('from-7')
    expect(to().id).toBe('to-7')
  })
})
