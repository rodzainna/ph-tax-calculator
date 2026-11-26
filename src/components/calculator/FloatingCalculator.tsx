import { useCallback, useState } from 'react'
import CalculatorTab from '@/components/calculator/CalculatorTab.tsx'
import CalculatorWindow from '@/components/calculator/CalculatorWindow.tsx'
import { initialCalc, pasteAmount, press, type CalcKey } from '@/lib/calc.ts'
import type { CalculatorMode } from '@/lib/calcMode.ts'
import { useCalcBox } from '@/lib/useCalcBox.ts'

interface Props {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
}

/** The floating calculator. It stays mounted while hidden or closed, so the calculation, place and size are kept. */
export default function FloatingCalculator({ mode, onModeChange }: Props) {
  const [{ calc, pasteRefused }, setState] = useState(() => ({ calc: initialCalc(), pasteRefused: false }))
  const { box, nudge, grab } = useCalcBox()

  // Kept the same between renders, so the window's paste listener is not added again on every key.
  const paste = useCallback((text: string) => {
    setState((s) => {
      const pasted = pasteAmount(s.calc, text)
      return pasted ? { calc: pasted, pasteRefused: false } : { ...s, pasteRefused: true }
    })
  }, [])

  if (mode === 'closed') return null
  if (mode === 'tucked') return <CalculatorTab onOpen={() => onModeChange('open')} />

  return (
    <CalculatorWindow
      box={box}
      nudge={nudge}
      grab={grab}
      calc={calc}
      pasteRefused={pasteRefused}
      onKey={(key: CalcKey) => setState((s) => ({ calc: press(s.calc, key), pasteRefused: false }))}
      onPaste={paste}
      // Coming back to the calculator clears the paste message, as focusing a money field does.
      onReturn={() => setState((s) => ({ ...s, pasteRefused: false }))}
      onHide={() => onModeChange('tucked')}
    />
  )
}
