import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router'
import { metaFor, PAGE_TAGS } from '@/lib/pageMeta.ts'

/** Keeps the tab title and the description matching the page on screen. */
export function usePageMeta(): void {
  const { pathname } = useLocation()

  // A layout effect, so the title has changed before analytics reads it for a page view.
  useLayoutEffect(() => {
    const meta = metaFor(pathname)
    document.title = meta.title
    for (const { selector, value } of PAGE_TAGS) {
      document.querySelector(selector)?.setAttribute('content', value(meta))
    }
  }, [pathname])
}
