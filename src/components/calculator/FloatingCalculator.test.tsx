// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KEY_STEP, MARGIN, startBox } from '@/lib/calcBox.ts'
import type { CalculatorMode } from '@/lib/calcMode.ts'
import FloatingCalculator from './FloatingCalculator.tsx'

const desktop = { w: 1440, h: 900 }
const start = startBox(desktop)
const capture = vi.fn()

/** The width left of the page's scrollbar. jsdom has no layout, so it has to be given. */
const pageWidthIs = (width: number) =>
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: width })

const windowIs = ({ w, h }: { w: number; h: number }, scrollbar = 0) => {
  vi.stubGlobal('innerWidth', w)
  vi.stubGlobal('innerHeight', h)
  pageWidthIs(w - scrollbar)
  act(() => void window.dispatchEvent(new Event('resize')))
}

beforeEach(() => {
  // jsdom has no pointer capture.
  HTMLElement.prototype.setPointerCapture = capture
  windowIs(desktop)
})

afterEach(() => {
  cleanup()
  capture.mockClear()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document.documentElement, 'clientWidth')
})

function Harness() {
  const [mode, setMode] = useState<CalculatorMode>('open')
  return <FloatingCalculator mode={mode} onModeChange={setMode} />
}

const open = () => {
  const user = userEvent.setup()
  render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  )
  return user
}

const panel = () => screen.getByRole('group', { name: 'Calculator' })
const place = () => {
  const { left, top, width, height } = panel().style
  const [x, y, w, h] = [left, top, width, height].map(Number.parseFloat)
  return { x, y, w, h }
}
const button = (name: string | RegExp) => within(panel()).getByRole('button', { name })
const grip = () => button(/^Move calculator/)
const corner = () => button(/^Resize calculator/)
const titleBar = () => grip().closest('[data-title-bar]') as HTMLElement
const shown = () => within(panel()).getByRole('status').textContent

type Point = Partial<PointerEventInit>
/** A main-button press at (500, 100) with the first pointer, unless told otherwise. */
const pointer = (init: Point = {}): Point => ({
  pointerId: 1,
  isPrimary: true,
  button: 0,
  clientX: 500,
  clientY: 100,
  ...init,
})
const press = (target: Element, init?: Point) => fireEvent.pointerDown(target, pointer(init))
const moveTo = (target: Element, clientX: number, clientY: number, init?: Point) =>
  fireEvent.pointerMove(target, pointer({ ...init, clientX, clientY }))

describe('dragging the title bar', () => {
  it.each([
    ['the bar', titleBar],
    ['the grip', grip],
  ])('moves the calculator by %s, measured from where the drag began', (_, handle) => {
    open()
    press(handle())
    moveTo(handle(), 450, 130)
    expect(place()).toEqual({ ...start, x: start.x - 50, y: start.y + 30 })
    moveTo(handle(), 400, 200)
    expect(place()).toEqual({ ...start, x: start.x - 100, y: start.y + 100 })
    expect(capture).toHaveBeenCalledWith(1)
  })

  it('stops at the edge of the window', () => {
    open()
    press(titleBar())
    moveTo(titleBar(), -5000, -5000)
    expect(place()).toEqual({ ...start, x: MARGIN, y: MARGIN })
  })

  it.each(['pointerUp', 'pointerCancel', 'lostPointerCapture'] as const)('ends on %s', (end) => {
    open()
    press(titleBar())
    fireEvent[end](titleBar(), pointer())
    moveTo(titleBar(), 300, 300)
    expect(place()).toEqual(start)
  })

  it.each<[string, Point]>([
    ['the right button', { button: 2 }],
    ['the middle button', { button: 1 }],
    ['a Control-click, which opens a menu on a Mac', { ctrlKey: true }],
    ['a second finger', { isPrimary: false, pointerId: 2 }],
  ])('does not start with %s', (_, init) => {
    open()
    press(titleBar(), init)
    moveTo(titleBar(), 300, 300, init)
    expect(place()).toEqual(start)
  })

  it('follows only the pointer that started it', () => {
    open()
    press(titleBar())
    press(titleBar(), { pointerId: 2, clientX: 900 })
    moveTo(titleBar(), 100, 100, { pointerId: 2 })
    expect(place()).toEqual(start)
    fireEvent.pointerUp(titleBar(), pointer({ pointerId: 2 }))
    moveTo(titleBar(), 480, 100)
    expect(place().x).toBe(start.x - 20)
  })

  it('does not start from the X button', () => {
    open()
    press(button('Hide calculator to the side'))
    moveTo(titleBar(), 300, 300)
    expect(place()).toEqual(start)
  })

  it('is over once the calculator hides, so coming back and moving the pointer does nothing', async () => {
    const user = open()
    press(titleBar())
    moveTo(titleBar(), 460, 120)
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Open calculator' }))
    const left = place()
    moveTo(titleBar(), 200, 300)
    expect(place()).toEqual(left)
  })
})

describe('resizing from the corner', () => {
  it('drags to a new size', () => {
    open()
    press(corner())
    moveTo(corner(), 540, 160)
    expect(place()).toMatchObject({ w: start.w + 40, h: start.h + 60 })
  })

  it('ignores the right button', () => {
    open()
    press(corner(), { button: 2 })
    moveTo(corner(), 600, 200, { button: 2 })
    expect(place()).toEqual(start)
  })
})

describe('moving and resizing with the arrow keys', () => {
  it('moves from the grip, and stops the arrows from scrolling the page', () => {
    open()
    expect(fireEvent.keyDown(grip(), { key: 'ArrowLeft' })).toBe(false)
    fireEvent.keyDown(grip(), { key: 'ArrowDown' })
    expect(place()).toEqual({ ...start, x: start.x - KEY_STEP, y: start.y + KEY_STEP })
  })

  it('resizes from the corner', () => {
    open()
    expect(fireEvent.keyDown(corner(), { key: 'ArrowRight' })).toBe(false)
    fireEvent.keyDown(corner(), { key: 'ArrowDown' })
    expect(place()).toMatchObject({ w: start.w + KEY_STEP, h: start.h + KEY_STEP })
  })

  it('leaves the arrows alone elsewhere on the calculator', () => {
    open()
    expect(fireEvent.keyDown(panel(), { key: 'ArrowLeft' })).toBe(true)
    expect(place()).toEqual(start)
  })

  it('still takes typing while the grip has the focus', async () => {
    const user = open()
    act(() => grip().focus())
    await user.keyboard('12')
    expect(shown()).toBe('12')
  })
})

describe('using the mouse on the grip or the corner', () => {
  it.each([
    ['the grip', grip],
    ['the corner', corner],
  ])('leaves Enter as equals after a click on %s', async (_, control) => {
    const user = open()
    await user.keyboard('5+3')
    await user.click(control())
    expect(document.activeElement).toBe(panel())
    await user.keyboard('{Enter}')
    expect(shown()).toBe('8')
  })
})

describe('Enter with keyboard focus on the grip or the corner', () => {
  it.each([
    ['the grip', grip],
    ['the corner', corner],
  ])('still works out the result from %s', async (_, control) => {
    const user = open()
    await user.keyboard('5+3')
    act(() => control().focus())
    await user.keyboard('{ArrowLeft}{Enter}')
    expect(shown()).toBe('8')
  })
})

describe('arrows held with a modifier', () => {
  it.each(['ctrlKey', 'metaKey', 'altKey'])('are left to the browser with %s, on the grip and the corner', (held) => {
    open()
    for (const control of [grip(), corner()]) {
      expect(fireEvent.keyDown(control, { key: 'ArrowLeft', [held]: true })).toBe(true)
    }
    expect(place()).toEqual(start)
  })
})

describe('the running line', () => {
  /** A line longer than its box. jsdom has no layout, so its length and scrolling are stood in for. */
  const longLine = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.keyboard('1+2+')
    const line = within(panel()).getByTitle('1 + 2 +')
    Object.defineProperty(line, 'scrollWidth', { configurable: true, value: 500 })
    Object.defineProperty(line, 'scrollLeft', { configurable: true, writable: true, value: 0 })
    return line
  }

  it.each([
    ['resized from the corner', () => void fireEvent.keyDown(corner(), { key: 'ArrowLeft' })],
    ['narrowed by the window', () => windowIs({ w: 240, h: 900 })],
  ])('shows its newest end again after the calculator is %s', async (_, narrow) => {
    const line = await longLine(open())
    narrow()
    expect(line.scrollLeft).toBe(500)
  })
})

describe('the page scrollbar', () => {
  it('is left clear when the calculator is moved fully right', () => {
    windowIs(desktop, 15)
    open()
    press(titleBar())
    moveTo(titleBar(), 5000, 100)
    expect(place().x + place().w).toBe(desktop.w - 15 - MARGIN)
  })

  it('is made room for when it appears without the window changing size', () => {
    let pageChanged = () => {}
    const watch = vi.fn()
    const stop = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          pageChanged = callback
        }
        observe = watch
        disconnect = stop
      },
    )
    open()
    expect(watch).toHaveBeenCalledWith(document.documentElement)
    press(titleBar())
    moveTo(titleBar(), 5000, 100)
    pageWidthIs(desktop.w - 15)
    act(() => pageChanged())
    expect(place().x + place().w).toBe(desktop.w - 15 - MARGIN)
    cleanup()
    expect(stop).toHaveBeenCalled()
  })
})

describe('resizing in a window too small for the chosen size', () => {
  /** The largest size, then a window that cuts its height down. */
  const largeInASmallWindow = () => {
    press(corner())
    moveTo(corner(), 5000, 5000)
    fireEvent.pointerUp(corner(), pointer())
    const chosen = place()
    windowIs({ w: 700, h: 460 })
    return chosen
  }
  const cornerDrag = (...points: Array<[number, number]>) => {
    press(corner())
    for (const [x, y] of points) moveTo(corner(), x, y)
    fireEvent.pointerUp(corner(), pointer())
  }

  it.each<[string, () => void, number]>([
    ['an arrow that cannot make it taller', () => void fireEvent.keyDown(corner(), { key: 'ArrowDown' }), 0],
    ['an arrow that only narrows it', () => void fireEvent.keyDown(corner(), { key: 'ArrowLeft' }), -KEY_STEP],
    ['a sideways drag of the corner', () => cornerDrag([460, 100]), -40],
    ['a drag that ends where it began', () => cornerDrag([460, 60], [500, 100]), 0],
  ])('keeps the chosen height after %s', (_, resize, widthChange) => {
    open()
    const chosen = largeInASmallWindow()
    resize()
    windowIs(desktop)
    expect(place()).toMatchObject({ w: chosen.w + widthChange, h: chosen.h })
  })
})

describe('a press that moves nothing', () => {
  it.each([
    ['the title bar', titleBar],
    ['the corner', corner],
  ])('on %s leaves the calculator following its starting place', (_, handle) => {
    open()
    press(handle())
    moveTo(handle(), 500, 100)
    fireEvent.pointerUp(handle(), pointer())
    windowIs({ w: 1600, h: 900 })
    expect(place()).toEqual(startBox({ w: 1600, h: 900 }))
  })
})

describe('the chosen place and size', () => {
  const moveLeftAndDown = () => {
    press(titleBar())
    moveTo(titleBar(), 100, 300)
    fireEvent.pointerUp(titleBar(), pointer())
  }

  it('comes back after the window has been small', () => {
    open()
    moveLeftAndDown()
    const chosen = place()
    windowIs({ w: 700, h: 500 })
    expect(place().y + place().h).toBeLessThanOrEqual(500 - MARGIN)
    windowIs(desktop)
    expect(place()).toEqual(chosen)
  })

  it.each([
    ['dragged', () => moveLeftAndDown()],
    ['moved with an arrow key', () => void fireEvent.keyDown(grip(), { key: 'ArrowLeft' })],
  ])('keeps the chosen size when it is %s in a window too small for it', (_, move) => {
    open()
    press(corner())
    moveTo(corner(), 600, 300)
    fireEvent.pointerUp(corner(), pointer())
    const chosen = place()
    windowIs({ w: 700, h: 460 })
    expect(place().h).toBeLessThan(chosen.h)
    move()
    windowIs(desktop)
    expect(place()).toMatchObject({ w: chosen.w, h: chosen.h })
  })

  it('keeps the usual size when it is moved in a short window without ever being resized', () => {
    open()
    windowIs({ w: 700, h: 375 })
    moveLeftAndDown()
    windowIs(desktop)
    expect(place()).toMatchObject({ w: start.w, h: start.h })
  })

  it('is kept while the calculator is hidden', async () => {
    const user = open()
    moveLeftAndDown()
    const chosen = place()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Open calculator' }))
    expect(place()).toEqual(chosen)
  })
})
