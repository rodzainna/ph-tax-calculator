// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'
import { metaFor, NOT_FOUND_META, PAGE_META, PAGE_TAGS, withPageMeta } from '@/lib/pageMeta.ts'
import { ANNUAL_FIRST_YEAR } from '@/lib/taxYears.ts'
import { CONTRIBUTIONS_FIRST_YEAR } from '@/engine/rules/contributions.ts'
import indexHtml from '../../index.html?raw'
import llms from '../../public/llms.txt?raw'
import robots from '../../public/robots.txt?raw'
import sitemap from '../../public/sitemap.xml?raw'
import banner from '../../public/og-banner.jpg?inline'

beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const routes = Object.keys(PAGE_META)
const everyPage = [...Object.values(PAGE_META), NOT_FOUND_META]
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const content = (page: Document, selector: string) => page.querySelector(selector)?.getAttribute('content')
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('the page titles and descriptions', () => {
  it('are different on every page', () => {
    expect(new Set(everyPage.map((meta) => meta.title)).size).toBe(everyPage.length)
    expect(new Set(everyPage.map((meta) => meta.description)).size).toBe(everyPage.length)
  })

  it.each(everyPage)('are short enough not to be cut off in search results: $title', ({ title, description }) => {
    expect(title.length).toBeLessThanOrEqual(60)
    expect(description.length).toBeLessThanOrEqual(160)
  })

  it.each(routes)('belong to a page that exists: %s', (route) => {
    renderAt(route)
    expect(screen.queryByText('That page does not exist')).toBeNull()
  })

  it('are found whatever the capitals or the slash at the end, as the router finds the page', () => {
    for (const path of ['/year/', '/YEAR', '/Year//']) expect(metaFor(path), path).toBe(PAGE_META['/year'])
    expect(metaFor('/')).toBe(PAGE_META['/'])
    for (const path of ['/nothing', '/year/2026']) expect(metaFor(path), path).toBe(NOT_FOUND_META)
  })

  it('follow the page as you move around the app', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(document.title).toBe(PAGE_META['/']!.title)
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Annual' }))
    expect(document.title).toBe(PAGE_META['/year']!.title)
    await user.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Terms' }))
    expect(document.title).toBe(PAGE_META['/terms']!.title)
  })

  it('also update the description tags on the page', () => {
    document.head.innerHTML = '<meta name="description" content=""><meta property="og:title" content="">'
    renderAt('/about')
    expect(content(document, 'meta[name="description"]')).toBe(PAGE_META['/about']!.description)
    expect(content(document, 'meta[property="og:title"]')).toBe(PAGE_META['/about']!.title)
    document.head.innerHTML = ''
  })
})

describe('index.html', () => {
  it('has the home page title and description', () => {
    expect(withPageMeta(indexHtml, PAGE_META['/']!)).toBe(indexHtml)
  })

  it.each(routes)('can be rewritten with every tag for %s', (route) => {
    const meta = PAGE_META[route]!
    const page = parse(withPageMeta(indexHtml, meta))
    expect(page.title).toBe(meta.title)
    for (const { selector, value } of PAGE_TAGS) expect(content(page, selector), selector).toBe(value(meta))
  })

  it('escapes text that would break the HTML', () => {
    const odd = { title: 'A & <B>', description: 'Say "hi" for $1' }
    const page = parse(withPageMeta(indexHtml, odd))
    expect(page.title).toBe(odd.title)
    expect(content(page, 'meta[name="description"]')).toBe(odd.description)
  })

  it('fails loudly when a tag is missing', () => {
    expect(() => withPageMeta('<title>x</title>', NOT_FOUND_META)).toThrow('no tag matching')
  })

  it('points link previews to a banner that exists, at the size it states', () => {
    const page = parse(indexHtml)
    const image = new URL(content(page, 'meta[property="og:image"]')!)
    expect(image.origin).toBe('https://ph-tax-calculator.rodzainna.com')
    expect(image.pathname).toBe('/og-banner.jpg')
    // A JPEG keeps its size after the frame marker: two bytes of height, then two of width.
    const bytes = Uint8Array.from(atob(banner.split(',')[1]!), (character) => character.charCodeAt(0))
    const frame = bytes.findIndex((byte, i) => byte === 0xff && [0xc0, 0xc2].includes(bytes[i + 1]!))
    const twoBytes = (at: number) => bytes[at]! * 256 + bytes[at + 1]!
    expect(twoBytes(frame + 7)).toBe(Number(content(page, 'meta[property="og:image:width"]')))
    expect(twoBytes(frame + 5)).toBe(Number(content(page, 'meta[property="og:image:height"]')))
  })
})

describe('what crawlers get', () => {
  it('may be read in full: no robots rule or tag keeps them out', () => {
    expect(robots).toContain('User-agent: *\nAllow: /\n')
    expect(robots).not.toMatch(/^Disallow:\s*\S/m)
    expect(indexHtml).not.toMatch(/noindex|nofollow/)
  })

  it('has a sitemap that lists every page once, and robots.txt points to it', () => {
    const document = new DOMParser().parseFromString(sitemap, 'application/xml')
    expect(document.querySelector('parsererror')).toBeNull()
    expect(document.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9')
    const addresses = [...document.querySelectorAll('url > loc')].map((loc) => new URL(loc.textContent!))
    expect(addresses.map((address) => address.pathname)).toEqual(routes)
    for (const address of addresses) expect(address.origin).toBe('https://ph-tax-calculator.rodzainna.com')
    expect(robots).toContain('\nSitemap: https://ph-tax-calculator.rodzainna.com/sitemap.xml\n')
  })

  it('is an llms.txt that links to every page', () => {
    const links = [...llms.matchAll(/\]\((https:[^)]+)\)/g)].map((match) => new URL(match[1]!).pathname)
    expect(links).toEqual(routes)
  })

  it('states the same years in llms.txt as the app uses', () => {
    expect(llms).toContain(`Tax years ${ANNUAL_FIRST_YEAR} onward.`)
    expect(llms).toContain(`For ${CONTRIBUTIONS_FIRST_YEAR} onward it can estimate`)
    expect(llms).toContain(`For ${ANNUAL_FIRST_YEAR} to ${CONTRIBUTIONS_FIRST_YEAR - 1}, contributions are typed in`)
  })
})
