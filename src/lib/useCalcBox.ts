import { useEffect, useState } from 'react'
import { chosenAfter, shownBox, type Box, type Reshape, type Viewport } from './calcBox.ts'

/** The room the calculator may use. The width leaves out the page's scrollbar, which innerWidth counts. */
const pageSize = (): Viewport => ({ w: document.documentElement.clientWidth, h: window.innerHeight })

/**
 * Where the calculator sits. Every move or resize starts from the box on screen, which is what the person sees. Nothing
 * is saved: a reload puts it back in its starting place.
 */
export function useCalcBox() {
  const [{ chosen, view }, setState] = useState(() => ({ chosen: null as Box | null, view: pageSize() }))

  useEffect(() => {
    const measure = () =>
      setState((s) => {
        const next = pageSize()
        return next.w === s.view.w && next.h === s.view.h ? s : { ...s, view: next }
      })
    window.addEventListener('resize', measure)
    // A scrollbar that comes or goes with the page's content changes the width without resizing the window.
    const pageObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    pageObserver?.observe(document.documentElement)
    return () => {
      window.removeEventListener('resize', measure)
      pageObserver?.disconnect()
    }
  }, [])

  const box = shownBox(chosen, view)

  /** One step, such as an arrow key. */
  const nudge = (reshape: Reshape, dx: number, dy: number) =>
    setState((s) => {
      const from = shownBox(s.chosen, s.view)
      return { ...s, chosen: chosenAfter(s.chosen, from, reshape(from, dx, dy, s.view)) }
    })

  /**
   * Takes hold for a drag. The function it returns is given how far the pointer is from where it started, and works
   * from how things stood then, so dragging back puts everything as it was.
   */
  const grab = (reshape: Reshape) => (dx: number, dy: number) =>
    setState((s) => ({ ...s, chosen: chosenAfter(chosen, box, reshape(box, dx, dy, s.view)) }))

  return { box, nudge, grab }
}

export type CalcBox = ReturnType<typeof useCalcBox>
