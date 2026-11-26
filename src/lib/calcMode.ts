/** closed: not on the page. open: floating over the page. tucked: hidden, with a tab on the right edge. */
export type CalculatorMode = 'closed' | 'open' | 'tucked'

/** What the header's calculator button does: it closes an open calculator, and opens it otherwise. */
export const afterHeaderButton = (mode: CalculatorMode): CalculatorMode => (mode === 'open' ? 'closed' : 'open')
