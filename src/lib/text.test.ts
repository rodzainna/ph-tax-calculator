import { describe, expect, it } from 'vitest'
import { splitLastWord } from './text.ts'

describe('splitLastWord', () => {
  it('keeps the last word apart, with the space before it in the head', () => {
    expect(splitLastWord('Annual income tax')).toEqual({ head: 'Annual income ', tail: 'tax' })
  })

  it('leaves a single word whole', () => {
    expect(splitLastWord('Credits')).toEqual({ head: '', tail: 'Credits' })
  })

  it('does not split on a leading space or an empty text', () => {
    expect(splitLastWord(' Tax')).toEqual({ head: '', tail: ' Tax' })
    expect(splitLastWord('')).toEqual({ head: '', tail: '' })
  })
})
