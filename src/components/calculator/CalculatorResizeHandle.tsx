import type { KeyboardEvent } from 'react'
import { arrowStep, LIMITS, resizeBox } from '@/lib/calcBox.ts'
import type { CalcBox } from '@/lib/useCalcBox.ts'
import { useDrag } from '@/lib/useDrag.ts'

/** The bottom-right corner. Drag it, or use the arrow keys on it, to resize the calculator. */
export default function CalculatorResizeHandle({ nudge, grab }: Pick<CalcBox, 'nudge' | 'grab'>) {
  const drag = useDrag(() => grab(resizeBox))

  const resizeByKey = (e: KeyboardEvent) => {
    const step = arrowStep(e)
    if (!step) return
    e.preventDefault()
    nudge(resizeBox, step.dx, step.dy)
  }

  return (
    <button
      type="button"
      data-enter-equals
      {...drag}
      onKeyDown={resizeByKey}
      aria-label={`Resize calculator. Use the arrow keys. Between ${LIMITS.minW} and ${LIMITS.maxW} pixels wide and ${LIMITS.minH} and ${LIMITS.maxH} tall.`}
      title="Drag, or use the arrow keys, to resize"
      // 24px, the smallest comfortable target, with square corners: a rounded one would not take the pointer all over.
      // The calculator leaves this much room under its keys.
      className="absolute bottom-0 right-0 flex size-6 cursor-nwse-resize touch-none items-end justify-end p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      {/* The file is used as a mask, so the grip takes the button's text colour, including on hover. */}
      <span aria-hidden className="size-3 bg-current [mask:url(/resize-grip-icon.svg)_center/contain_no-repeat]" />
    </button>
  )
}
