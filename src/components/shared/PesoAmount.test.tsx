// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { formatPeso } from '@/lib/peso.ts'
import PesoAmount from './PesoAmount.tsx'

afterEach(cleanup)

const draw = (value: number, size: 'hero' | 'total' = 'hero') =>
  render(<PesoAmount value={value} size={size} />).container

/** The width, in ems, that the hero figure is scaled against. */
const emsFor = (value: number): number => {
  const figure = draw(value).querySelector<HTMLElement>('[style]')
  const ems = Number(figure?.style.getPropertyValue('--figure-ems'))
  cleanup()
  return ems
}

describe('PesoAmount', () => {
  it.each([0, 45_000.5, -10_000, 27_600_562_789.64])('reads like formatPeso for %s', (value) => {
    expect(draw(value).textContent).toBe(formatPeso(value))
  })

  it('shows zero for an amount that is not a number', () => {
    expect(draw(Number.NaN).textContent).toBe(formatPeso(0))
  })

  it('allows more room the longer a hero figure is, counting a minus sign', () => {
    expect(emsFor(1_000_000_000)).toBeGreaterThan(emsFor(45_000))
    expect(emsFor(-45_000)).toBeGreaterThan(emsFor(45_000))
  })

  it('gives a hero figure its own box to be sized against', () => {
    const box = draw(45_000).firstElementChild as HTMLElement
    expect(box.classList.contains('@container')).toBe(true)
    expect(box.firstElementChild?.getAttribute('style')).toContain('--figure-ems')
  })

  it('leaves a total at the size of the text around it', () => {
    const container = draw(45_000, 'total')
    expect(container.querySelector('[style]')).toBeNull()
    expect(container.querySelector('.\\@container')).toBeNull()
  })
})
