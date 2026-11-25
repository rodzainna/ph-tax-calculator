// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import PesoInput from './PesoInput.tsx'

afterEach(cleanup)

function Harness({ initial = '', emphasis, hint }: { initial?: string; emphasis?: 'hero' | 'soft'; hint?: string }) {
  const [value, setValue] = useState(initial)
  return <PesoInput label="Amount" value={value} onChange={setValue} emphasis={emphasis} hint={hint} />
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

  it('tidies the decimals when you leave the field', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '1000.5')
    await user.tab()
    expect(field().value).toBe('1,000.50')
  })
})

describe('PesoInput: the cursor when the field adds or drops a leading zero', () => {
  it.each([
    ['.5', '0.5'],
    ['.50', '0.50'],
    ['.75', '0.75'],
    ['00.25', '0.25'],
    ['007', '7'],
  ])('reads "%s" typed into an empty field as %s', async (keys, amount) => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), keys)
    expect(field().value).toBe(amount)
    expect(field().selectionStart).toBe(amount.length)
  })

  it('takes centavos typed over a whole amount', async () => {
    const user = userEvent.setup()
    render(<Harness initial="25,000" />)
    await user.type(field(), '.75', { initialSelectionStart: 0, initialSelectionEnd: 6 })
    expect(field().value).toBe('0.75')
  })

  it('puts the cursor after the dot when one is typed in front of an amount', async () => {
    const user = userEvent.setup()
    render(<Harness initial="75" />)
    await user.type(field(), '.', { initialSelectionStart: 0, initialSelectionEnd: 0 })
    expect(field().value).toBe('0.75')
    expect(field().selectionStart).toBe(2)
  })

  it('keeps the cursor at the start when a zero typed there is dropped', async () => {
    const user = userEvent.setup()
    render(<Harness initial="50" />)
    await user.type(field(), '0', { initialSelectionStart: 0, initialSelectionEnd: 0 })
    expect(field().value).toBe('50')
    expect(field().selectionStart).toBe(0)
    await user.keyboard('1')
    expect(field().value).toBe('150')
  })
})

describe('PesoInput: compact', () => {
  const box = (value: string) => {
    render(<PesoInput label="Amount" value={value} onChange={() => {}} compact />)
    return field().parentElement as HTMLElement
  }

  it.each([
    ['', 'w-36'],
    ['9,999,999.99', 'w-36'],
    ['99,999,999.99', 'w-40'],
  ])('is wide enough for "%s" (%s)', (value, width) => {
    expect(box(value).classList.contains(width)).toBe(true)
  })
})

const ERROR = 'Enter a valid amount up to 99,999,999.99'
const error = () => screen.queryByRole('alert')?.textContent ?? null

const paste = async (text: string) => {
  const user = userEvent.setup()
  await user.click(field())
  await user.paste(text)
  return user
}

describe('PesoInput: pasting', () => {
  it.each([
    ['50000', '50,000'],
    ['50,000.5', '50,000.5'],
    ['₱ 50,000.50', '50,000.50'],
    ['PHP 50,000.00', '50,000.00'],
    ['Php. 50,000', '50,000'],
    ['php50000', '50,000'],
    ['P. 50,000', '50,000'],
    ['P.50000', '50,000'],
    ['.75', '0.75'],
    [' ₱50,000\n', '50,000'],
    ['99,999,999.99', '99,999,999.99'],
  ])('takes "%s" as %s, replacing what was there', async (pasted, amount) => {
    render(<Harness initial="25,000" />)
    await paste(pasted)
    expect(field().value).toBe(amount)
    expect(field().selectionStart).toBe(amount.length)
    expect(error()).toBeNull()
  })

  it.each([
    '100,000,000',
    'Php. 100000000',
    '1.234.567.890',
    '50.000,00',
    '50,00',
    '1,00,000',
    '12.345',
    '-500',
    '1e3',
    '50 000',
    '50,000 PHP',
    'Amount: 50,000',
    'Rs.500',
    'fifty',
  ])('keeps the old amount and says why when "%s" is pasted', async (pasted) => {
    render(<Harness initial="25,000" />)
    await paste(pasted)
    expect(field().value).toBe('25,000')
    expect(error()).toBe(ERROR)
  })

  it('replaces the whole amount even with the cursor in the middle of it', async () => {
    render(<Harness initial="1,234" />)
    const user = userEvent.setup()
    await user.type(field(), '{ArrowLeft}', { initialSelectionStart: 3, initialSelectionEnd: 3 })
    await user.paste('9')
    expect(field().value).toBe('9')
  })
})

describe('PesoInput: dragging', () => {
  it('ignores text dropped onto it, so dragged digits never become the amount', () => {
    render(<Harness initial="25,000" />)
    const allowed = fireEvent.drop(field(), { dataTransfer: { getData: () => '25' } })
    expect(allowed).toBe(false)
    expect(field().value).toBe('25,000')
    expect(error()).toBeNull()
  })

  it('does not let its digits be dragged away', () => {
    render(<Harness initial="25,000" />)
    expect(fireEvent.dragStart(field())).toBe(false)
  })
})

describe('PesoInput: the largest amount', () => {
  it('takes 99,999,999.99 typed in', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '99999999.99')
    expect(field().value).toBe('99,999,999.99')
    expect(error()).toBeNull()
  })

  it('does not take a ninth digit of pesos, and says why', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(field(), '100000000')
    expect(field().value).toBe('10,000,000')
    expect(error()).toBe(ERROR)
  })

  it('refuses a digit in the middle of a full field and leaves the cursor where it was', async () => {
    const user = userEvent.setup()
    render(<Harness initial="99,999,999" />)
    await user.type(field(), '1', { initialSelectionStart: 2, initialSelectionEnd: 2 })
    expect(field().value).toBe('99,999,999')
    expect(field().selectionStart).toBe(2)
  })

  it('still takes centavos once the pesos are full', async () => {
    const user = userEvent.setup()
    render(<Harness initial="99,999,999" />)
    await user.type(field(), '.99')
    expect(field().value).toBe('99,999,999.99')
    expect(error()).toBeNull()
  })

  it.each([
    ['Backspace', 11],
    ['Delete', 10],
  ])('keeps the amount when %s on the decimal point would make it too long', async (key, cursor) => {
    const user = userEvent.setup()
    render(<Harness initial="99,999,999.99" />)
    await user.type(field(), `{${key}}`, { initialSelectionStart: cursor, initialSelectionEnd: cursor })
    expect(field().value).toBe('99,999,999.99')
    expect(field().selectionStart).toBe(cursor)
    expect(error()).toBe(ERROR)
  })

  it('lets a full field be shortened', async () => {
    const user = userEvent.setup()
    render(<Harness initial="99,999,999" />)
    await user.type(field(), '{Backspace}')
    expect(field().value).toBe('9,999,999')
    expect(error()).toBeNull()
  })
})

describe('PesoInput: a second decimal point', () => {
  it.each([
    ['among the pesos', '1,234.50', 1],
    ['among the centavos', '1,234.50', 7],
    ['at the end', '1,234.50', 8],
    ['right after the first', '1,234.', 6],
  ])('is refused %s, rather than moving the decimal point', async (_where, amount, cursor) => {
    const user = userEvent.setup()
    render(<Harness initial={amount} />)
    await user.type(field(), '.', { initialSelectionStart: cursor, initialSelectionEnd: cursor })
    expect(field().value).toBe(amount)
    expect(field().selectionStart).toBe(cursor)
    expect(error()).toBe(ERROR)
  })

  it('still lets a dot be typed over the one that is there', async () => {
    const user = userEvent.setup()
    render(<Harness initial="1,234.50" />)
    await user.type(field(), '.', { initialSelectionStart: 5, initialSelectionEnd: 6 })
    expect(field().value).toBe('1,234.50')
    expect(field().selectionStart).toBe(6)
    expect(error()).toBeNull()
  })

  it('still takes a new amount typed over the whole one', async () => {
    const user = userEvent.setup()
    render(<Harness initial="1,234.50" />)
    await user.type(field(), '.75', { initialSelectionStart: 0, initialSelectionEnd: 8 })
    expect(field().value).toBe('0.75')
    expect(error()).toBeNull()
  })
})

describe('PesoInput: edits that would change the digits', () => {
  it.each([
    ['a dot typed where it would cut digits off', '1,234', '.', 1, 1],
    ['a digit typed in front of two centavos', '1.50', '9', 2, 2],
    ['a third centavo digit', '1.50', '9', 4, 4],
    ['Backspace on the dot', '1,234.50', '{Backspace}', 6, 6],
    ['Delete on the dot', '1,234.50', '{Delete}', 5, 5],
    ['removing the dot along with the digit before it', '1,234.50', '{Backspace}', 4, 6],
    ['typing over the dot and a centavo digit', '1,234.50', '7', 5, 7],
  ])('refuses %s', async (_what, amount, keys, from, to) => {
    const user = userEvent.setup()
    render(<Harness initial={amount} />)
    await user.type(field(), keys, { initialSelectionStart: from, initialSelectionEnd: to })
    expect(field().value).toBe(amount)
    expect(error()).toBe(ERROR)
  })

  it.each([
    ['a dot that leaves two digits after it', '12,345', '.', 4, 4, '123.45'],
    ['removing a dot with nothing after it', '1,234.', '{Backspace}', 6, 6, '1,234'],
    ['removing the dot with its centavos', '1,234.50', '{Backspace}', 5, 8, '1,234'],
    ['removing from the pesos to the end', '1,234.50', '{Backspace}', 4, 8, '123'],
    ['a new digit typed over everything', '1,234.50', '9', 0, 8, '9'],
  ])('still allows %s', async (_what, amount, keys, from, to, result) => {
    const user = userEvent.setup()
    render(<Harness initial={amount} />)
    await user.type(field(), keys, { initialSelectionStart: from, initialSelectionEnd: to })
    expect(field().value).toBe(result)
    expect(error()).toBeNull()
  })
})

describe('PesoInput: text inserted without a paste', () => {
  /** What a browser reports when a keyboard puts text in on its own: the new value and what was inserted. */
  const insert = (value: string, data: string, inputType = 'insertText') =>
    fireEvent.input(field(), { target: { value }, data, inputType })

  it('reads a clear amount like a paste, replacing what was there', () => {
    render(<Harness initial="25,000" />)
    insert('25,000Php. 50,000', 'Php. 50,000')
    expect(field().value).toBe('50,000')
    expect(error()).toBeNull()
  })

  it.each(['50.000,00', 'Amount: 50,000', '-500'])('refuses "%s" like a paste', (text) => {
    render(<Harness initial="25,000" />)
    insert(text, text)
    expect(field().value).toBe('25,000')
    expect(error()).toBe(ERROR)
  })

  it('treats several digits at once, as from a "00" key, as typing', () => {
    render(<Harness initial="25" />)
    insert('2500', '00')
    expect(field().value).toBe('2,500')
  })

  it('leaves text still being composed to the typing rules', () => {
    render(<Harness initial="1,000" />)
    insert('1,00012.5', '12.5', 'insertCompositionText')
    expect(field().value).toBe('100,012.5')
  })
})

describe('PesoInput: a message about an amount that has changed elsewhere', () => {
  /** Two fields showing one amount, as Tax withheld does in a card and in its summary. */
  function Pair({ initial }: { initial: string }) {
    const [value, setValue] = useState(initial)
    return (
      <>
        <PesoInput label="Amount" value={value} onChange={setValue} />
        <PesoInput label="Same amount" value={value} onChange={setValue} />
      </>
    )
  }
  const other = () => screen.getByRole('textbox', { name: 'Same amount' }) as HTMLInputElement

  it('goes away, and stays away if the old amount comes back', async () => {
    render(<Pair initial="100" />)
    const user = await paste('fifty')
    await user.type(other(), '0')
    expect(error()).toBeNull()
    await user.type(other(), '{Backspace}')
    expect(field().value).toBe('100')
    expect(error()).toBeNull()
  })

  it('stays when leaving the field only tidies the centavos', async () => {
    render(<Harness initial="1,000.5" />)
    const user = await paste('fifty')
    await user.tab()
    expect(field().value).toBe('1,000.50')
    expect(error()).toBe(ERROR)
  })
})

describe('PesoInput: the error message', () => {
  it('marks the field and describes it, along with any hint', async () => {
    render(<Harness hint="So far this year" />)
    expect(field().getAttribute('aria-invalid')).toBeNull()
    await paste('fifty')
    expect(field().getAttribute('aria-invalid')).toBe('true')
    const described = field().getAttribute('aria-describedby')!.split(' ')
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(['So far this year', ERROR])
  })

  it('goes away with the next amount typed', async () => {
    render(<Harness />)
    const user = await paste('fifty')
    await user.keyboard('5')
    expect(error()).toBeNull()
    expect(field().getAttribute('aria-invalid')).toBeNull()
  })

  it('goes away with a pasted amount that works', async () => {
    render(<Harness />)
    const user = await paste('fifty')
    await user.paste('50')
    expect(error()).toBeNull()
  })

  it('goes away when the amount already there is pasted again', async () => {
    render(<Harness initial="25,000" />)
    const user = await paste('fifty')
    await user.paste('25,000')
    expect(field().value).toBe('25,000')
    expect(error()).toBeNull()
  })

  it('stays when you leave the field, so nothing below moves under a click, and goes when you return', async () => {
    render(<Harness />)
    const user = await paste('fifty')
    await user.tab()
    expect(error()).toBe(ERROR)
    await user.click(field())
    expect(error()).toBeNull()
  })
})
