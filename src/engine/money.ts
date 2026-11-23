/** Money for the engine: pesos to the centavo for payslips, and to the whole peso the way eBIRForms rounds every computed line. */
const noNegativeZero = (n: number): number => (n === 0 ? 0 : n)

export function roundToCentavos(amount: number): number {
  // EPSILON nudges values like 1.005 (stored as 1.00499999...) to the intended half-up result.
  return noNegativeZero(Math.round((amount + Number.EPSILON) * 100) / 100)
}

/** The whole peso, as the BIR form's own JavaScript does it (Math.round: halves go up, so 9,184.50 becomes 9,185). */
export function roundToPeso(amount: number): number {
  return noNegativeZero(Math.round(amount))
}
