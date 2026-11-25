// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import StatTile from './StatTile.tsx'

afterEach(cleanup)

const show = (value: string, info?: string) =>
  render(
    <TooltipProvider>
      <StatTile label="Annual tax" value={value} info={info} />
    </TooltipProvider>,
  )

describe('StatTile', () => {
  it('shows the label and the value as given', () => {
    const { container } = show('₱12,345')
    expect(container.textContent).toBe('Annual tax₱12,345')
  })

  it('has an ⓘ named after the label when there is something to explain', () => {
    show('₱12,345', 'What this means.')
    expect(screen.getByRole('button', { name: 'More about Annual tax' })).toBeTruthy()
  })

  it('has no ⓘ otherwise', () => {
    show('₱12,345')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it.each([
    ['12345678', 'text-base'],
    ['123456789', 'text-sm'],
    ['1234567890', 'text-sm'],
    ['12345678901', 'text-xs'],
  ])('sizes a value of %s so that it fits', (value, size) => {
    show(value)
    expect(screen.getByText(value).className).toContain(size)
  })
})
