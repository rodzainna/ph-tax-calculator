// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SOURCES } from '@/lib/aboutSources.ts'
import About from '@/pages/About.tsx'

afterEach(cleanup)

describe('About', () => {
  it('has one page heading', () => {
    render(<About />)
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['About & sources'])
  })

  it('shows every source with its status, note and links', () => {
    render(<About />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(SOURCES.length)
    SOURCES.forEach((source, index) => {
      const item = within(items[index]!)
      expect(item.getByRole('heading', { level: 3 }).textContent).toBe(source.topic)
      expect(item.getByText(source.status, { exact: true })).toBeTruthy()
      if (source.note) expect(item.getByText(source.note)).toBeTruthy()
      expect(item.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(source.links.map((l) => l.href))
    })
  })

  it('opens each source in a new tab without handing it this page', () => {
    render(<About />)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })
})
