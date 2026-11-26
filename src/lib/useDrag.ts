import { useRef, type PointerEvent } from 'react'

/** Told how far the pointer is from where the drag began. */
type Drag = (dx: number, dy: number) => void

interface Gesture {
  pointerId: number
  x: number
  y: number
  drag: Drag
}

/** The main mouse button, a pen or the first finger, and not on a control marked `data-no-drag`. */
const startsDrag = (e: PointerEvent) =>
  e.isPrimary && e.button === 0 && !e.ctrlKey && !(e.target as Element).closest('[data-no-drag]')

/**
 * Pointer handlers for dragging an element. `onStart` is called once as a drag begins, and what it returns follows the
 * pointer until the drag ends. The drag is held by the component using this, so it is dropped if that component leaves
 * the page in the middle of one.
 */
export function useDrag(onStart: () => Drag) {
  const gesture = useRef<Gesture | null>(null)

  const end = (e: PointerEvent) => {
    if (gesture.current?.pointerId === e.pointerId) gesture.current = null
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      if (gesture.current || !startsDrag(e)) return
      // The drag carries on when the pointer leaves the element.
      e.currentTarget.setPointerCapture(e.pointerId)
      gesture.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, drag: onStart() }
    },
    onPointerMove: (e: PointerEvent) => {
      const g = gesture.current
      if (g?.pointerId === e.pointerId) g.drag(e.clientX - g.x, e.clientY - g.y)
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  }
}
