/** Where the floating calculator is and how big it is, with the rules that keep it usable. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Viewport {
  w: number
  h: number
}

/** The smallest and biggest sizes in pixels. At the minimum height the keys are still close to square. */
export const LIMITS = { minW: 224, maxW: 420, minH: 376, maxH: 640 }
/** Space kept between the calculator and the edge of the window. */
export const MARGIN = 12
/** The size it opens at, and its distance from the right edge. */
const START = { w: 248, h: 416, right: 24 }
/** Narrower than this (Tailwind's sm) the header takes two rows. */
const ONE_ROW_HEADER_WIDTH = 640
/** The distance from the top that clears the header. */
const START_TOP = { oneRowHeader: 88, twoRowHeader: 116 }

/** `min` wins if `max` is below it, so in a window too small for the box its top-left corner stays at the margin. */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/** Keeps the size within the limits and the window; on a tiny screen the window wins over the minimum. */
export function clampSize(w: number, h: number, view: Viewport): { w: number; h: number } {
  const roomW = Math.max(0, view.w - 2 * MARGIN)
  const roomH = Math.max(0, view.h - 2 * MARGIN)
  return {
    w: clamp(w, Math.min(LIMITS.minW, roomW), Math.min(LIMITS.maxW, roomW)),
    h: clamp(h, Math.min(LIMITS.minH, roomH), Math.min(LIMITS.maxH, roomH)),
  }
}

/** Fits a box into the window: size first, then position so every edge stays visible. */
export function clampBox(box: Box, view: Viewport): Box {
  const { w, h } = clampSize(box.w, box.h, view)
  return {
    w,
    h,
    x: clamp(box.x, MARGIN, view.w - w - MARGIN),
    y: clamp(box.y, MARGIN, view.h - h - MARGIN),
  }
}

/** Where a new calculator opens: near the top right. */
export function startBox(view: Viewport): Box {
  const { w, h, right } = START
  const top = view.w < ONE_ROW_HEADER_WIDTH ? START_TOP.twoRowHeader : START_TOP.oneRowHeader
  return clampBox({ x: view.w - w - right, y: top, w, h }, view)
}

/** Resizes from the bottom-right corner by (dx, dy). Near an edge the box slides away, so it can still reach full size. */
export function resizeBox(start: Box, dx: number, dy: number, view: Viewport): Box {
  return clampBox({ ...start, w: start.w + dx, h: start.h + dy }, view)
}
