import { X } from 'lucide-react'
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import CalculatorDisplay from '@/components/calculator/CalculatorDisplay.tsx'
import CalculatorKeypad from '@/components/calculator/CalculatorKeypad.tsx'
import CalculatorIcon from '@/components/shared/CalculatorIcon.tsx'
import {
  expressionText,
  formatDisplay,
  initialCalc,
  pasteAmount,
  pendingOperator,
  press,
  screenText,
  type CalcKey,
} from '@/lib/calc.ts'
import { calcKeyFor } from '@/lib/calcKeys.ts'
import { useStartBox } from '@/lib/useStartBox.ts'

interface Props {
  open: boolean
  onClose: () => void
}

/** A calculator floating over the page. It stays mounted while closed, so the calculation is kept. */
export default function FloatingCalculator({ open, onClose }: Props) {
  const [{ calc, pasteRefused }, setState] = useState(() => ({ calc: initialCalc(), pasteRefused: false }))
  const box = useStartBox()
  const panel = useRef<HTMLDivElement>(null)

  // The keyboard works as soon as it opens. The panel is a div, so a phone does not show its keyboard.
  useEffect(() => {
    if (open) panel.current?.focus({ preventScroll: true })
  }, [open])

  // A browser can send a paste to the page's highlighted text even with the focus in the calculator, so the panel alone
  // would miss it. The paste is heard on the document and taken only while the focus is in the calculator.
  useEffect(() => {
    const takePaste = (e: ClipboardEvent) => {
      if (!panel.current?.contains(document.activeElement)) return
      const text = e.clipboardData?.getData('text') ?? ''
      setState((s) => {
        const pasted = pasteAmount(s.calc, text)
        return pasted ? { calc: pasted, pasteRefused: false } : { ...s, pasteRefused: true }
      })
    }
    document.addEventListener('paste', takePaste)
    return () => document.removeEventListener('paste', takePaste)
  }, [])

  if (!open) return null

  const enter = (key: CalcKey) => setState((s) => ({ calc: press(s.calc, key), pasteRefused: false }))

  // Coming back to the calculator clears the paste message, as focusing a money field does.
  const handleFocus = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setState((s) => ({ ...s, pasteRefused: false }))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    // A button reached with the keyboard keeps its own Enter.
    if (e.key === 'Enter' && e.target instanceof HTMLButtonElement) return
    const key = calcKeyFor(e)
    if (!key) return
    e.preventDefault()
    enter(key)
  }

  // A clicked key does not take the focus, or Enter would press that key again instead of working out the result.
  const keepFocusOnPanel = (e: MouseEvent) => {
    e.preventDefault()
    panel.current?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={panel}
      role="group"
      aria-label="Calculator"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      // The keys and the display size their text from the calculator's own width (@container).
      className="@container fixed z-50 flex select-none flex-col overflow-hidden rounded-[20px] border border-foreground/10 bg-card text-card-foreground shadow-2xl outline-none"
    >
      <div className="relative flex shrink-0 items-center justify-between gap-2 bg-brand p-2.5 text-white">
        <span className="flex items-center gap-2">
          <CalculatorIcon className="icon-on-dark size-7 shrink-0" />
          <span className="text-sm font-semibold tracking-tight">Calculator</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          title="Close"
          className="flex size-6 items-center justify-center rounded-[22%] bg-white/10 text-white/80 ring-1 ring-white/15 transition-colors hover:bg-brand-coral hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="icon-on-dark size-3.5" aria-hidden />
        </button>
        {/* A thin coral-to-teal line under the title bar. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-coral via-brand-blush to-brand-teal-bright"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2" onMouseDown={keepFocusOnPanel}>
        <CalculatorDisplay
          expression={expressionText(calc)}
          text={calc.error ?? formatDisplay(screenText(calc))}
          isError={calc.error !== null}
          pasteRefused={pasteRefused}
          onBackspace={() => enter('⌫')}
        />
        <CalculatorKeypad pending={pendingOperator(calc)} onPress={enter} />
      </div>
    </div>
  )
}
