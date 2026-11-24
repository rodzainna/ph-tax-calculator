const NAMES = ['hasPointerCapture', 'releasePointerCapture', 'scrollIntoView'] as const

/**
 * jsdom has no pointer capture or scrollIntoView, which a Radix dropdown needs before it will open.
 * Call it in `beforeAll`, and call what it returns in `afterAll`: it puts each method back, or removes it if it was absent.
 */
export function stubRadixDomApis(): () => void {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>
  const before = NAMES.map((name) => ({
    name,
    had: Object.prototype.hasOwnProperty.call(proto, name),
    value: proto[name],
  }))
  proto.hasPointerCapture = () => false
  proto.releasePointerCapture = () => {}
  proto.scrollIntoView = () => {}
  return () => {
    for (const { name, had, value } of before) {
      if (had) proto[name] = value
      else delete proto[name]
    }
  }
}
