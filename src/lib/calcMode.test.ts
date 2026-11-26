import { describe, expect, it } from 'vitest'
import { afterHeaderButton } from './calcMode.ts'

describe('afterHeaderButton', () => {
  it.each([
    ['closed', 'open'],
    ['tucked', 'open'],
    ['open', 'closed'],
  ] as const)('takes a %s calculator to %s', (from, to) => {
    expect(afterHeaderButton(from)).toBe(to)
  })
})
