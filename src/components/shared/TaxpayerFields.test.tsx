// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Taxpayer } from '@/lib/taxpayer.ts'
import TaxpayerFields from './TaxpayerFields.tsx'

afterEach(cleanup)

const show = (taxpayer: Taxpayer, onTaxpayerChange = vi.fn(), types?: Taxpayer['type'][]) => {
  render(<TaxpayerFields idPrefix="t" year={2026} years={[2026, 2025]} onYearChange={() => {}} taxpayer={taxpayer} onTaxpayerChange={onTaxpayerChange} types={types} />)
  return onTaxpayerChange
}

describe('TaxpayerFields', () => {
  it('leaves a type the page offers alone', () => {
    const onChange = show({ type: 'self-employed', method: 'graduated' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('falls back to the first type the page offers when the current one is not offered', () => {
    const onChange = show({ type: 'mixed', method: 'eight-percent' })
    expect(onChange).toHaveBeenCalledWith({ type: 'employee', method: 'eight-percent' })
  })

  it('offers mixed income only when the page says so', () => {
    show({ type: 'mixed', method: 'graduated' }, vi.fn(), ['employee', 'self-employed', 'mixed'])
    expect(screen.getByRole('combobox', { name: 'I am' }).textContent).toContain('Mixed income')
  })

  it('asks for the tax option only when not an employee', () => {
    show({ type: 'employee', method: 'graduated' })
    expect(screen.queryByRole('combobox', { name: 'Tax option' })).toBeNull()
    cleanup()
    show({ type: 'self-employed', method: 'graduated' })
    expect(screen.getByRole('combobox', { name: 'Tax option' })).toBeTruthy()
  })
})
