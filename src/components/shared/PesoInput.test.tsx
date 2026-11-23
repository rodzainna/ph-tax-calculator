// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import PesoInput from './PesoInput.tsx'

afterEach(cleanup)

function Harness({ initial = '', emphasis }: { initial?: string; emphasis?: 'hero' | 'soft' }) {
  const [value, setValue] = useState(initial)
  return <PesoInput label="Amount" value={value} onChange={setValue} emphasis={emphasis} />
}

const field = () => screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement

describe('PesoInput', () => {
  it('puts commas in as you type', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '1234567.8')
    expect(field().value).toBe('1,234,567.8')
  })

  it('drops anything that is not a digit or a dot', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '₱ 12a,3')
    expect(field().value).toBe('123')
  })

  it('keeps the cursor next to what you typed when it is in the middle', async () => {
    const user = userEvent.setup()
    render(<Harness initial="1,234" />)
    await user.type(field(), '9', { initialSelectionStart: 1, initialSelectionEnd: 1 })
    expect(field().value).toBe('19,234')
    expect(field().selectionStart).toBe(2)
  })

  it('Backspace over a comma removes the digit before it, so the key is never dead', async () => {
    const user = userEvent.setup()
    render(<Harness initial="1,234" />)
    await user.type(field(), '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 2 })
    expect(field().value).toBe('234')
  })

  it('Delete on a leading zero does not change the amount: "0.5" stays "0.5", not "5"', async () => {
    const user = userEvent.setup()
    render(<Harness initial="0.5" />)
    await user.type(field(), '{Delete}', { initialSelectionStart: 0, initialSelectionEnd: 0 })
    expect(field().value).toBe('0.5')
  })

  it('refuses a digit once there are 12 whole-number digits', async () => {
    const user = userEvent.setup()
    render(<Harness initial="999,999,999,999" />)
    await user.type(field(), '1', { initialSelectionStart: 3, initialSelectionEnd: 3 })
    expect(field().value).toBe('999,999,999,999')
  })

  it('tidies the decimals when you leave the field', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '1000.5')
    await user.tab()
    expect(field().value).toBe('1,000.50')
  })
})
