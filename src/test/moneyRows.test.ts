// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { moneyRows } from './moneyRows.ts'

const html = (markup: string) => {
  const root = document.createElement('div')
  root.innerHTML = markup
  return root
}

describe('moneyRows', () => {
  it('reads the amount beside each label', () => {
    const root = html('<dl><div><dt>SSS</dt><dd>₱1.00</dd></div><div><dt>Total</dt><dd>₱2.00</dd></div></dl>')
    expect(moneyRows(root)).toEqual({ SSS: '₱1.00', Total: '₱2.00' })
  })

  it('reads only the amount, not a note under it', () => {
    const root = html('<dl><div><dt>13th month</dt><dd>₱5.00</dd><dd>Not counted</dd></div></dl>')
    expect(moneyRows(root)).toEqual({ '13th month': '₱5.00' })
  })

  it('gives null for a label with no amount', () => {
    expect(moneyRows(html('<dl><dt>Lonely</dt></dl>'))).toEqual({ Lonely: null })
  })

  it('gives nothing when there are no rows', () => {
    expect(moneyRows(html('<p>Nothing here</p>'))).toEqual({})
  })

  it('refuses two rows with the same label, since it could read the wrong one', () => {
    const root = html('<dl><dt>Gross receipts</dt><dd>₱1.00</dd></dl><dl><dt>Gross receipts</dt><dd>₱2.00</dd></dl>')
    expect(() => moneyRows(root)).toThrow('More than one row is labelled "Gross receipts"')
  })
})
