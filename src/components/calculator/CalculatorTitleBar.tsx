import { GripVertical, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import CalculatorIcon from '@/components/shared/CalculatorIcon.tsx'
import { arrowStep, moveBox } from '@/lib/calcBox.ts'
import type { CalcBox } from '@/lib/useCalcBox.ts'
import { useDrag } from '@/lib/useDrag.ts'
import { cn } from '@/lib/utils'

const BUTTON =
  'flex size-6 shrink-0 items-center justify-center rounded-[22%] bg-white/10 text-white/80 ring-1 ring-white/15 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white'

interface Props extends Pick<CalcBox, 'nudge' | 'grab'> {
  onHide: () => void
}

/** The title bar. Drag it, or use the arrow keys on its grip, to move the calculator. */
export default function CalculatorTitleBar({ nudge, grab, onHide }: Props) {
  const drag = useDrag(() => grab(moveBox))

  const moveByKey = (e: KeyboardEvent) => {
    const step = arrowStep(e)
    if (!step) return
    e.preventDefault()
    nudge(moveBox, step.dx, step.dy)
  }

  return (
    <div
      {...drag}
      data-title-bar
      // touch-none: a finger on the bar moves the calculator, not the page.
      className="relative flex shrink-0 cursor-grab touch-none items-center justify-between gap-2 bg-brand p-2.5 text-white active:cursor-grabbing"
    >
      <span className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          data-enter-equals
          onKeyDown={moveByKey}
          aria-label="Move calculator. Use the arrow keys."
          title="Drag, or use the arrow keys, to move"
          className={cn(BUTTON, 'cursor-grab active:cursor-grabbing')}
        >
          <GripVertical className="icon-on-dark size-3.5" aria-hidden />
        </button>
        {/* A narrow screen drops the icon to leave the bar less crowded. */}
        <CalculatorIcon className="icon-on-dark size-7 shrink-0 max-sm:hidden" />
        <span className="truncate text-sm font-semibold tracking-tight">Calculator</span>
      </span>
      <button
        type="button"
        data-no-drag
        onClick={onHide}
        aria-label="Hide calculator to the side"
        title="Hide to the side"
        className={cn(BUTTON, 'cursor-pointer hover:bg-brand-coral')}
      >
        <X className="icon-on-dark size-3.5" aria-hidden />
      </button>
      {/* A thin coral-to-teal line under the title bar. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-coral via-brand-blush to-brand-teal-bright"
      />
    </div>
  )
}
