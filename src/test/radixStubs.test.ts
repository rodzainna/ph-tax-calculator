// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { stubRadixDomApis } from './radixStubs.ts'

const NAMES = ['hasPointerCapture', 'releasePointerCapture', 'scrollIntoView'] as const

describe('stubRadixDomApis', () => {
  it('adds the three methods while it is on', () => {
    const restore = stubRadixDomApis()
    for (const name of NAMES) expect(typeof window.HTMLElement.prototype[name]).toBe('function')
    restore()
  })

  it('takes away what it added: jsdom has none of these, so none should be left, not even as undefined', () => {
    const own = () => NAMES.map((name) => Object.prototype.hasOwnProperty.call(window.HTMLElement.prototype, name))
    const restore = stubRadixDomApis()
    expect(own()).toEqual([true, true, true])
    restore()
    expect(own()).toEqual([false, false, false])
  })

  it('puts back a method that was there before', () => {
    const proto = window.HTMLElement.prototype
    const mine = () => 'mine'
    Object.defineProperty(proto, 'scrollIntoView', { value: mine, configurable: true, writable: true })
    const restore = stubRadixDomApis()
    restore()
    expect(proto.scrollIntoView).toBe(mine)
    delete (proto as { scrollIntoView?: unknown }).scrollIntoView
  })
})
