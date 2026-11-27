import { useEffect, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/** True when the next Tab would not start from the page: from a footer link, or from nowhere after a click. */
function isOutOfPlace(focused: Element | null): boolean {
  return focused === null || focused === document.body || focused.closest('footer') !== null
}

/**
 * Focuses an element that is not normally focusable. It stops being focusable once the focus leaves it or it is pressed.
 * Left focusable, a click on any text inside it would focus it, and in Chrome the next Tab would then jump back to its
 * first link.
 */
function focusForNow(element: HTMLElement): void {
  const done = () => {
    element.removeEventListener('blur', done)
    element.removeEventListener('pointerdown', done)
    element.removeAttribute('tabindex')
  }
  element.setAttribute('tabindex', '-1')
  element.focus({ preventScroll: true })
  element.addEventListener('blur', done)
  element.addEventListener('pointerdown', done)
}

/**
 * Opens a page reached by a link as a full page load would: at the top. A footer link stays on screen after the change,
 * and Safari does not focus a clicked link, so in both cases the focus moves to `page`. Without this the next Tab jumps
 * back to the bottom. Back and Forward are left to the browser.
 */
export function useOpenAtTop(page: RefObject<HTMLElement | null>): void {
  // The key changes on every visit, including a link to the page already shown.
  const { key } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
    if (page.current && isOutOfPlace(document.activeElement)) focusForNow(page.current)
  }, [key, navigationType, page])
}
