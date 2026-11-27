// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { CONTACT, HOSTING_PROVIDER, OWNER_NAME } from '@/config.ts'
import { CONTRIBUTIONS_FIRST_YEAR } from '@/engine/rules/contributions.ts'
import { ANNUAL_FIRST_YEAR } from '@/lib/taxYears.ts'
import Privacy from '@/pages/Privacy.tsx'
import Terms from '@/pages/Terms.tsx'

afterEach(cleanup)

const show = (page: React.ReactElement) => render(<MemoryRouter>{page}</MemoryRouter>)
const headings = (level: number) => screen.getAllByRole('heading', { level }).map((h) => h.textContent ?? '')

describe.each([
  ['Privacy Policy', Privacy, 7],
  ['Terms of Use', Terms, 11],
])('%s', (title, Page, sections) => {
  it('has one page heading and a date', () => {
    const { container } = show(<Page />)
    expect(headings(1)).toEqual([title])
    expect(container.textContent).toMatch(/Last updated: \d{1,2} [A-Z][a-z]+ \d{4}/)
  })

  it('numbers its sections in order with none missing', () => {
    show(<Page />)
    const numbers = headings(2).map((text) => Number(text.split('.')[0]))
    expect(numbers).toEqual(Array.from({ length: sections }, (_, i) => i + 1))
  })

  it('says who runs the site and links to the contact profile', () => {
    const { container } = show(<Page />)
    expect(container.textContent).toContain(OWNER_NAME)
    expect(screen.getByRole('link', { name: CONTACT.label }).getAttribute('href')).toBe(CONTACT.href)
  })

  it('opens links to other sites in a new tab without handing them this page', () => {
    show(<Page />)
    const outside = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('http'))
    expect(outside.length).toBeGreaterThan(0)
    for (const link of outside) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('does not describe donations or a consent prompt, which the site does not have', () => {
    const { container } = show(<Page />)
    expect(container.textContent).not.toMatch(/donat|google|analytics choice/i)
  })
})

describe('the years in the terms', () => {
  it('match the first year of the Annual page and of the estimated contributions', () => {
    const { container } = show(<Terms />)
    expect(container.textContent).toContain(`For tax years ${CONTRIBUTIONS_FIRST_YEAR} onward, the calculator can`)
    expect(container.textContent).toContain(
      `For ${ANNUAL_FIRST_YEAR} to ${CONTRIBUTIONS_FIRST_YEAR - 1}, you enter your own contributions`,
    )
  })
})

describe('what the terms say is estimated and left out', () => {
  it('does not promise contribution estimates the app does not make', () => {
    const { container } = show(<Terms />)
    expect(container.textContent).toContain("can estimate an employee's SSS, PhilHealth and Pag-IBIG contributions")
    expect(container.textContent).toContain(
      'only the Monthly page estimates SSS and PhilHealth, when you switch them on, and you type Pag-IBIG yourself.',
    )
  })

  it('says which way each thing left out could move the figure', () => {
    const { container } = show(<Terms />)
    expect(container.textContent).toContain('percentage tax or VAT on your sales, so you could owe more than shown.')
    expect(container.textContent).toContain('against the legal limits, so your tax could be higher than shown.')
    expect(container.textContent).toContain('if you are entitled to deduct one, your tax could be lower than shown.')
  })
})

describe('what the privacy policy states', () => {
  it('covers everything typed, not only amounts', () => {
    const { container } = show(<Privacy />)
    expect(headings(2)[0]).toBe('1. What you type stays in your browser')
    expect(container.textContent).toContain('What you type stays in your browser. It is never sent to me')
    expect(container.textContent).toContain(
      'Everything you enter, including amounts, dates and any names you give benefits or expenses,',
    )
  })

  it('names the host', () => {
    const { container } = show(<Privacy />)
    expect(container.textContent).toContain(`The site is hosted by ${HOSTING_PROVIDER}.`)
  })

  it('claims to hold none of your figures, not nothing about you, because the host sees technical details', () => {
    const { container } = show(<Privacy />)
    expect(container.textContent).toContain('I have none of them to hand back or delete.')
    expect(container.textContent).not.toContain('nothing of yours')
  })

  it('credits the rights to the Act and its implementing rules', () => {
    const { container } = show(<Privacy />)
    expect(container.textContent).toContain('(Republic Act 10173) and its implementing rules give you rights')
  })
})
