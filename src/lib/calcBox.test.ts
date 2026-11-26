import { describe, expect, it } from 'vitest'
import {
  arrowStep,
  chosenAfter,
  clampBox,
  clampSize,
  KEY_STEP,
  LIMITS,
  MARGIN,
  moveBox,
  resizeBox,
  shownBox,
  startBox,
  type Box,
} from './calcBox.ts'

const desktop = { w: 1440, h: 900 }
const phone = { w: 375, h: 700 }

describe('clampSize', () => {
  it('keeps a size between the minimum and the maximum', () => {
    expect(clampSize(100, 100, desktop)).toEqual({ w: LIMITS.minW, h: LIMITS.minH })
    expect(clampSize(2000, 2000, desktop)).toEqual({ w: LIMITS.maxW, h: LIMITS.maxH })
    expect(clampSize(300, 450, desktop)).toEqual({ w: 300, h: 450 })
  })

  it('is never bigger than the window less the margins', () => {
    expect(clampSize(420, 640, phone).w).toBe(phone.w - 2 * MARGIN)
    expect(clampSize(420, 900, phone).h).toBe(640)
  })

  it('goes under the minimum when the window is smaller than it', () => {
    expect(clampSize(232, 400, { w: 220, h: 300 })).toEqual({ w: 196, h: 276 })
  })

  it('is never negative', () => {
    expect(clampSize(232, 400, { w: 10, h: 0 })).toEqual({ w: 0, h: 0 })
  })
})

describe('clampBox', () => {
  it('leaves a box that fits alone', () => {
    const box: Box = { x: 100, y: 100, w: 264, h: 408 }
    expect(clampBox(box, desktop)).toEqual(box)
  })

  it('pulls a box back from any side', () => {
    expect(clampBox({ x: -50, y: -50, w: 264, h: 408 }, desktop)).toMatchObject({ x: MARGIN, y: MARGIN })
    expect(clampBox({ x: 5000, y: 5000, w: 264, h: 408 }, desktop)).toMatchObject({
      x: desktop.w - 264 - MARGIN,
      y: desktop.h - 408 - MARGIN,
    })
  })

  it('shrinks and moves a box when the window gets smaller', () => {
    expect(clampBox({ x: 1000, y: 300, w: 420, h: 640 }, { w: 500, h: 500 })).toEqual({
      x: 500 - 420 - MARGIN,
      y: MARGIN,
      w: 420,
      h: 500 - 2 * MARGIN,
    })
  })

  it('stays at the margin in a window too small to hold it', () => {
    expect(clampBox({ x: 0, y: 0, w: 248, h: 416 }, { w: 10, h: 10 })).toEqual({ x: MARGIN, y: MARGIN, w: 0, h: 0 })
  })

  it('changes nothing the second time', () => {
    for (const view of [desktop, phone, { w: 200, h: 200 }, { w: 10, h: 10 }]) {
      const once = clampBox({ x: 900, y: -20, w: 600, h: 100 }, view)
      expect(clampBox(once, view)).toEqual(once)
    }
  })
})

describe('startBox', () => {
  it('starts near the top right', () => {
    expect(startBox(desktop)).toEqual({ x: 1168, y: 88, w: 248, h: 416 })
  })

  it('starts lower on a phone, clear of the two-row header', () => {
    expect(startBox(phone)).toEqual({ x: 103, y: 116, w: 248, h: 416 })
    expect(startBox({ w: 639, h: 800 }).y).toBe(116)
    expect(startBox({ w: 640, h: 800 }).y).toBe(88)
  })

  it('still fits the smallest common phone', () => {
    const view = { w: 320, h: 568 }
    expect(startBox(view)).toEqual({ x: 48, y: 116, w: 248, h: 416 })
  })

  it('moves up and shrinks on a short window', () => {
    expect(startBox({ w: 700, h: 375 })).toEqual({ x: 428, y: MARGIN, w: 248, h: 351 })
  })
})

describe('resizeBox, from the bottom-right corner', () => {
  const start: Box = { x: 200, y: 100, w: 264, h: 408 }

  it('grows and shrinks while the top-left stays put', () => {
    expect(resizeBox(start, 40, 60, desktop)).toEqual({ x: 200, y: 100, w: 304, h: 468 })
    expect(resizeBox(start, -20, -10, desktop)).toEqual({ x: 200, y: 100, w: 244, h: 398 })
  })

  it('stops at the minimum and maximum sizes', () => {
    expect(resizeBox(start, -500, -500, desktop)).toMatchObject({ w: LIMITS.minW, h: LIMITS.minH })
    expect(resizeBox(start, 900, 900, desktop)).toMatchObject({ w: LIMITS.maxW, h: LIMITS.maxH })
  })

  it('slides away from an edge so it can still reach the maximum size', () => {
    expect(resizeBox({ x: 1100, y: 500, w: 264, h: 380 }, 400, 400, desktop)).toEqual({
      x: desktop.w - LIMITS.maxW - MARGIN,
      y: desktop.h - LIMITS.maxH - MARGIN,
      w: LIMITS.maxW,
      h: LIMITS.maxH,
    })
  })
})

describe('shownBox', () => {
  const chosen: Box = { x: 900, y: 300, w: 320, h: 500 }

  it('is the starting place until the calculator is moved or resized', () => {
    expect(shownBox(null, desktop)).toEqual(startBox(desktop))
    expect(shownBox(null, phone)).toEqual(startBox(phone))
  })

  it('fits the chosen box into a small window, and shows it as chosen again in a bigger one', () => {
    expect(shownBox(chosen, { w: 700, h: 500 })).toEqual({ x: 368, y: MARGIN, w: 320, h: 476 })
    expect(shownBox(chosen, desktop)).toEqual(chosen)
  })
})

describe('moveBox', () => {
  const start: Box = { x: 200, y: 100, w: 264, h: 408 }

  it('moves the box and keeps its size', () => {
    expect(moveBox(start, -50, 30, desktop)).toEqual({ x: 150, y: 130, w: 264, h: 408 })
  })

  it('stops at the edges of the window', () => {
    expect(moveBox(start, -900, -900, desktop)).toEqual({ x: MARGIN, y: MARGIN, w: 264, h: 408 })
    expect(moveBox(start, 5000, 5000, desktop)).toEqual({ x: 1164, y: 480, w: 264, h: 408 })
  })
})

describe('chosenAfter a move or resize', () => {
  const view = { w: 700, h: 460 }
  const chosen: Box = { x: 100, y: 100, w: 420, h: 640 }
  /** What is on screen in the small window: the height is cut down to fit. */
  const from = shownBox(chosen, view)

  it('changes nothing when nothing changed on screen', () => {
    expect(chosenAfter(chosen, from, { ...from })).toBe(chosen)
    expect(chosenAfter(null, startBox(view), startBox(view))).toBeNull()
  })

  it('keeps the chosen size through a move', () => {
    const to = moveBox(from, -40, 0, view)
    expect(chosenAfter(chosen, from, to)).toEqual({ x: to.x, y: to.y, w: 420, h: 640 })
  })

  it('keeps the chosen height when only the width changes', () => {
    expect(chosenAfter(chosen, from, resizeBox(from, -16, 0, view))).toMatchObject({ w: 404, h: 640 })
  })

  it('keeps the chosen width when only the height changes', () => {
    const wide = { ...chosen, h: 400 }
    const narrow = { w: 300, h: 700 }
    const fitted = shownBox(wide, narrow)
    expect(chosenAfter(wide, fitted, resizeBox(fitted, 0, 40, narrow))).toMatchObject({ w: 420, h: 440 })
  })

  it('takes both sizes when both change', () => {
    expect(chosenAfter(chosen, from, resizeBox(from, -40, -20, view))).toMatchObject({ w: 380, h: 416 })
  })

  it('always draws as what was on screen', () => {
    for (const [dx, dy] of [
      [-40, 0],
      [0, -40],
      [-40, -40],
      [0, 40],
      [500, 500],
    ]) {
      for (const reshape of [moveBox, resizeBox]) {
        const to = reshape(from, dx, dy, view)
        expect(shownBox(chosenAfter(chosen, from, to), view), `${reshape.name} ${dx},${dy}`).toEqual(to)
      }
    }
  })

  it('keeps the usual size for a calculator that was never resized, however short the window', () => {
    const short = { w: 700, h: 375 }
    const start = startBox(short)
    expect(chosenAfter(null, start, moveBox(start, -40, 0, short))).toMatchObject({ w: 248, h: 416 })
  })
})

describe('arrowStep', () => {
  const pressed = (key: string, modifier: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...modifier,
  })

  it.each([
    ['ArrowLeft', -KEY_STEP, 0],
    ['ArrowRight', KEY_STEP, 0],
    ['ArrowUp', 0, -KEY_STEP],
    ['ArrowDown', 0, KEY_STEP],
  ])('turns %s into one step', (key, dx, dy) => {
    expect(arrowStep(pressed(key))).toEqual({ dx, dy })
  })

  it.each(['Enter', '5', 'toString'])('has no step for %s', (key) => {
    expect(arrowStep(pressed(key))).toBeNull()
  })

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('leaves an arrow held with %s to the browser', (modifier) => {
    expect(arrowStep(pressed('ArrowLeft', { [modifier]: true }))).toBeNull()
  })
})
