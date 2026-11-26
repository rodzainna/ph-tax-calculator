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
/** How far one press of an arrow key moves or resizes the calculator. */
export const KEY_STEP = 16

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

/**
 * The box to draw. `chosen` is where the person last put it, or null if they never have. It is fitted to the window only
 * for drawing, so it comes back when the window grows again.
 */
export function shownBox(chosen: Box | null, view: Viewport): Box {
  return chosen ? clampBox(chosen, view) : startBox(view)
}

/** Moves by (dx, dy), keeping every edge in the window. */
export function moveBox(start: Box, dx: number, dy: number, view: Viewport): Box {
  return clampBox({ ...start, x: start.x + dx, y: start.y + dy }, view)
}

/** Resizes from the bottom-right corner by (dx, dy). Near an edge the box slides away, so it can still reach full size. */
export function resizeBox(start: Box, dx: number, dy: number, view: Viewport): Box {
  return clampBox({ ...start, w: start.w + dx, h: start.h + dy }, view)
}

/** A move or a resize by (dx, dy). */
export type Reshape = (start: Box, dx: number, dy: number, view: Viewport) => Box

const isSameBox = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h

/**
 * What to remember after a move or resize that took the box on screen from `from` to `to`. `chosen` is what was
 * remembered before it, or null for nothing. A small window may only be cutting a size down for now, so a width or
 * height that did not change on screen stays as it was chosen, and a gesture that changed nothing is forgotten.
 */
export function chosenAfter(chosen: Box | null, from: Box, to: Box): Box | null {
  if (isSameBox(from, to)) return chosen
  const { w, h } = chosen ?? START
  return { ...to, w: to.w === from.w ? w : to.w, h: to.h === from.h ? h : to.h }
}

const ARROW_STEPS = new Map([
  ['ArrowLeft', { dx: -KEY_STEP, dy: 0 }],
  ['ArrowRight', { dx: KEY_STEP, dy: 0 }],
  ['ArrowUp', { dx: 0, dy: -KEY_STEP }],
  ['ArrowDown', { dx: 0, dy: KEY_STEP }],
])

interface Pressed {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

/** The step an arrow key stands for. Null for other keys, and for arrows that are the browser's own shortcuts. */
export function arrowStep({ key, ctrlKey, metaKey, altKey }: Pressed): { dx: number; dy: number } | null {
  if (ctrlKey || metaKey || altKey) return null
  return ARROW_STEPS.get(key) ?? null
}
