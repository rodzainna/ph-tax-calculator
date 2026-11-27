// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

// The code names files in public/ by address, so a renamed or missing one would only show up as a broken image.
const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}', '../index.html'], {
  eager: true,
  query: '?raw',
  import: 'default',
})
const files = import.meta.glob<string>('../public/**/*.{svg,jpg,txt}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const present = Object.keys(files).map((path) => path.replace('../public', ''))
const named = [
  ...new Set(
    Object.values(sources).flatMap((source) => source.match(/(?<=["'`(])\/[\w-]+\.(svg|jpg|txt)(?=["'`)])/g) ?? []),
  ),
]

describe('files in public/', () => {
  it('include every one the code names', () => {
    expect(named).toContain('/shield-check-icon.svg')
    expect(named).toContain('/resize-grip-icon.svg')
    for (const file of named) expect(present, file).toContain(file)
  })

  it.each(present.filter((file) => file.endsWith('.svg')))('%s is a valid SVG', (file) => {
    const document = new DOMParser().parseFromString(files[`../public${file}`]!, 'image/svg+xml')
    expect(document.querySelector('parsererror')).toBeNull()
    expect(document.documentElement.tagName).toBe('svg')
  })
})
