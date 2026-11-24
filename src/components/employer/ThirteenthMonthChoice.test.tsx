// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ThirteenthMode } from '@/lib/yearForm.ts'
import ThirteenthMonthChoice from './ThirteenthMonthChoice.tsx'

afterEach(cleanup)

const show = (mode: ThirteenthMode, custom = '') => {
  const onModeChange = vi.fn()
  const onCustomChange = vi.fn()
  render(
    <ThirteenthMonthChoice mode={mode} custom={custom} onModeChange={onModeChange} onCustomChange={onCustomChange} />,
  )
  return { onModeChange, onCustomChange }
}

describe('ThirteenthMonthChoice', () => {
  it('offers the three ways to treat the 13th month, with the current one chosen', () => {
    show('unpaid')
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Estimate', 'Not paid yet', 'Enter amount'])
    expect(screen.getByRole('radio', { name: 'Not paid yet' }).getAttribute('aria-checked')).toBe('true')
  })

  it('is announced once, as the name of the group, not as a heading plus a group of the same name', () => {
    show('estimate')
    const group = screen.getByRole('radiogroup', { name: '13th month' })
    expect(group.getAttribute('aria-label')).toBeNull()
    expect(group.getAttribute('aria-labelledby')).toBe(screen.getByText('13th month').id)
  })

  it('reports the choice made', async () => {
    const { onModeChange } = show('estimate')
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Enter amount' }))
    expect(onModeChange).toHaveBeenCalledWith('custom')
  })

  it('asks for an amount only when the choice is to enter one', () => {
    show('estimate')
    expect(screen.queryByRole('textbox', { name: '13th month received' })).toBeNull()
    cleanup()
    show('unpaid')
    expect(screen.queryByRole('textbox', { name: '13th month received' })).toBeNull()
    cleanup()
    show('custom', '20,000')
    expect((screen.getByRole('textbox', { name: '13th month received' }) as HTMLInputElement).value).toBe('20,000')
  })

  it('reports the amount typed', async () => {
    const { onCustomChange } = show('custom')
    await userEvent.setup().type(screen.getByRole('textbox', { name: '13th month received' }), '5')
    expect(onCustomChange).toHaveBeenCalledWith('5')
  })
})
