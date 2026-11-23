// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SegmentedControl from './SegmentedControl.tsx'

afterEach(cleanup)

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
] as const

describe('SegmentedControl', () => {
  it('reports the one you choose', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Pick" value="a" onChange={onChange} options={[...OPTIONS]} />)
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('never ends up with nothing chosen: pressing the chosen one again does nothing', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Pick" value="a" onChange={onChange} options={[...OPTIONS]} />)
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Alpha' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
