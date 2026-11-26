import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import CalculatorDisplay from '@/components/calculator/CalculatorDisplay.tsx'
import CalculatorKeypad from '@/components/calculator/CalculatorKeypad.tsx'
import CalculatorResizeHandle from '@/components/calculator/CalculatorResizeHandle.tsx'
import CalculatorTitleBar from '@/components/calculator/CalculatorTitleBar.tsx'
import { expressionText, formatDisplay, pendingOperator, screenText, type CalcKey, type CalcState } from '@/lib/calc.ts'
import { calcKeyFor } from '@/lib/calcKeys.ts'
import type { CalcBox } from '@/lib/useCalcBox.ts'

interface Props extends CalcBox {
  calc: CalcState
  pasteRefused: boolean
  onKey: (key: CalcKey) => void
  onPaste: (text: string) => void
  /** The focus has come back from outside the calculator. */
  onReturn: () => void
  onHide: () => void
}

/** The calculator while it is open, floating over the page. */
export default function CalculatorWindow({
  box,
  nudge,
  grab,
  calc,
  pasteRefused,
  onKey,
  onPaste,
  onReturn,
  onHide,
}: Props) {
  const panel = useRef<HTMLDivElement>(null)

  // The keyboard works as soon as it opens. The panel is a div, so a phone does not show its keyboard.
  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [])

  // A browser can send a paste to the page's highlighted text even with the focus in the calculator, so the panel alone
  // would miss it. The paste is heard on the document and taken only while the focus is in the calculator.
  useEffect(() => {
    const takePaste = (e: ClipboardEvent) => {
      if (panel.current?.contains(document.activeElement)) onPaste(e.clipboardData?.getData('text') ?? '')
    }
    document.addEventListener('paste', takePaste)
    return () => document.removeEventListener('paste', takePaste)
  }, [onPaste])

  const handleFocus = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onReturn()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onHide()
      return
    }
    // A button reached with the keyboard keeps its own Enter, unless it is one that Enter would not press anything on.
    if (e.key === 'Enter' && e.target instanceof HTMLButtonElement && !('enterEquals' in e.target.dataset)) return
    const key = calcKeyFor(e)
    if (!key) return
    e.preventDefault()
    onKey(key)
  }

  // Nothing clicked inside takes the focus, or Enter would press that button again instead of working out the result.
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
      onMouseDown={keepFocusOnPanel}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      // The keys and the display size their text from the calculator's own width and height (cqw and cqh).
      className="[container-type:size] fixed z-50 select-none outline-none"
    >
      {/* The rounded card clips what is in it. The resize handle sits outside it, so its corner is not clipped. */}
      <div className="flex size-full flex-col overflow-hidden rounded-[20px] border border-foreground/10 bg-card text-card-foreground shadow-2xl">
        <CalculatorTitleBar nudge={nudge} grab={grab} onHide={onHide} />

        {/* The extra room at the bottom is for the resize handle, so it does not cover a key. */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pb-6">
          <CalculatorDisplay
            expression={expressionText(calc)}
            text={calc.error ?? formatDisplay(screenText(calc))}
            isError={calc.error !== null}
            pasteRefused={pasteRefused}
            onBackspace={() => onKey('⌫')}
            width={box.w}
          />
          <CalculatorKeypad pending={pendingOperator(calc)} onPress={onKey} />
        </div>
      </div>

      <CalculatorResizeHandle nudge={nudge} grab={grab} />
    </div>
  )
}
