import { ANNUAL_FIRST_YEAR } from './taxYears.ts'

// Each page's title and description. The build writes them into one HTML file per page, for link previews, which do
// not run the app. The app also sets them as you move between pages.

export interface PageMeta {
  title: string
  description: string
}

const titled = (page: string) => `${page} | PH Tax Calculator`

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: titled('Take-home pay calculator'),
    description:
      'Estimate monthly take-home pay in the Philippines after income tax and contributions, employed or self-employed. Estimates only, not tax advice.',
  },
  '/year': {
    title: titled('Annual income tax estimate'),
    description: `Estimate a year of Philippine income tax from jobs, business income or both, and what may still be due or overpaid. Tax years ${ANNUAL_FIRST_YEAR} onward.`,
  },
  '/about': {
    title: titled('About and sources'),
    description:
      'Where the tax rules in PH Tax Calculator come from, how far each one is confirmed, and what the calculator assumes.',
  },
  '/privacy': {
    title: titled('Privacy Policy'),
    description:
      'What happens to the information you enter in PH Tax Calculator, and what the site does and does not collect.',
  },
  '/terms': {
    title: titled('Terms of Use'),
    description:
      'The terms for using PH Tax Calculator. Its results are estimates for planning, not tax, legal or accounting advice.',
  },
}

export const NOT_FOUND_META: PageMeta = {
  title: titled('Page not found'),
  description: 'There is no page at this address on PH Tax Calculator.',
}

/** Like the router, this ignores capital letters and a slash at the end. */
export function metaFor(pathname: string): PageMeta {
  const path = pathname.toLowerCase().replace(/(?<=.)\/+$/, '')
  return PAGE_META[path] ?? NOT_FOUND_META
}

/** The tags that differ from page to page, and the value each one takes. */
export const PAGE_TAGS: { selector: string; pattern: RegExp; value: (meta: PageMeta) => string }[] = [
  {
    selector: 'meta[name="description"]',
    pattern: /(<meta\s+name="description"\s+content=")[^"]*(")/,
    value: (meta) => meta.description,
  },
  {
    selector: 'meta[property="og:title"]',
    pattern: /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    value: (meta) => meta.title,
  },
  {
    selector: 'meta[property="og:description"]',
    pattern: /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    value: (meta) => meta.description,
  },
]

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** The page's HTML with one page's title and description. It fails if a tag is missing, so the build fails too. */
export function withPageMeta(html: string, meta: PageMeta): string {
  const tags = [
    { pattern: /(<title>)[^<]*(<\/title>)/, value: meta.title },
    ...PAGE_TAGS.map(({ pattern, value }) => ({ pattern, value: value(meta) })),
  ]
  return tags.reduce((result, { pattern, value }) => {
    if (!pattern.test(result)) throw new Error(`index.html has no tag matching ${pattern}`)
    return result.replace(pattern, (_, before: string, after: string) => `${before}${escapeHtml(value)}${after}`)
  }, html)
}
