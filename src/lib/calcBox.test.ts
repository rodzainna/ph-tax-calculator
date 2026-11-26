import { describe, expect, it } from 'vitest'
import { clampBox, clampSize, LIMITS, MARGIN, resizeBox, startBox, type Box } from './calcBox.ts'

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

  it('fits on a phone', () => {
    expect(startBox(phone)).toEqual({ x: 103, y: 88, w: 248, h: 416 })
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
