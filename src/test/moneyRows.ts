/**
 * The label and amount of each money row in `container`, such as `{ SSS: '₱1,111.00' }`.
 * A row that takes money off reads "minus" before its amount.
 * Throws when two rows share a label, because a lookup could then read the wrong one: scope `container` to one card.
 */
export function moneyRows(container: HTMLElement): Record<string, string | null> {
  const rows: Record<string, string | null> = {}
  for (const term of container.querySelectorAll('dt')) {
    const label = term.textContent ?? ''
    if (label in rows) throw new Error(`More than one row is labelled "${label}"`)
    rows[label] = term.nextElementSibling?.textContent ?? null
  }
  return rows
}
