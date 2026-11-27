import { describe, expect, it } from 'vitest'
import { PAGIBIG_RULES, PHILHEALTH_RULES, SSS_RULES } from '../engine/rules/contributions.ts'
import { SOURCES } from './aboutSources.ts'

const row = (topic: string) => {
  const found = SOURCES.find((source) => source.topic === topic)
  if (!found) throw new Error(`no row called ${topic}`)
  return found
}

describe('the About sources', () => {
  it('lists each topic once', () => {
    const topics = SOURCES.map((source) => source.topic)
    expect(new Set(topics).size).toBe(topics.length)
  })

  it('gives every row at least one secure link, none twice', () => {
    for (const source of SOURCES) {
      const hrefs = source.links.map((link) => link.href)
      expect(hrefs.length, source.topic).toBeGreaterThan(0)
      expect(new Set(hrefs).size, source.topic).toBe(hrefs.length)
      for (const href of hrefs) expect(new URL(href).protocol, href).toBe('https:')
    }
  })

  it('uses one name for one address, and one address for one name', () => {
    const links = SOURCES.flatMap((source) => source.links)
    const pairs = new Set(links.map((link) => `${link.label} ${link.href}`))
    expect(new Set(links.map((link) => link.label)).size).toBe(pairs.size)
    expect(new Set(links.map((link) => link.href)).size).toBe(pairs.size)
  })

  it.each([
    ['SSS (employees)', SSS_RULES],
    ['PhilHealth (employees)', PHILHEALTH_RULES],
    ['Pag-IBIG (employees)', PAGIBIG_RULES],
  ])('does not call %s verified while one of its rules is not', (topic, rules) => {
    const allVerified = rules.every((rule) => rule.verified)
    expect(allVerified || row(topic).status !== 'Verified').toBe(true)
  })

  it('says what is assumed or unread on each row that is only partly verified', () => {
    for (const source of SOURCES.filter((s) => s.status !== 'Verified')) {
      expect(source.note, source.topic).toBeTruthy()
    }
  })
})
