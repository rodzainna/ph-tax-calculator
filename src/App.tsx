import { useState } from 'react'
import { Route, Routes } from 'react-router'
import FloatingCalculator from '@/components/calculator/FloatingCalculator.tsx'
import SiteHeader from '@/components/SiteHeader.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { afterHeaderButton, type CalculatorMode } from '@/lib/calcMode.ts'
import About from '@/pages/About.tsx'
import Monthly from '@/pages/Monthly.tsx'
import MyYear from '@/pages/MyYear.tsx'
import NotFound from '@/pages/NotFound.tsx'

export default function App() {
  const [calculator, setCalculator] = useState<CalculatorMode>('closed')

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col text-foreground">
        <SiteHeader
          calculatorOpen={calculator === 'open'}
          onToggleCalculator={() => setCalculator(afterHeaderButton)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<Monthly />} />
            <Route path="/year" element={<MyYear />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="mx-auto w-full max-w-6xl space-y-1 px-4 pb-8 pt-4 text-xs text-muted-foreground">
          <p className="max-w-3xl leading-relaxed">
            Estimates only, for planning purposes. Actual withholding may differ based on your employer's payroll setup.
            Consult the BIR or a licensed accountant for official computations.
          </p>
          <p>Nothing you type leaves your browser.</p>
        </footer>
      </div>
      <FloatingCalculator mode={calculator} onModeChange={setCalculator} />
    </TooltipProvider>
  )
}
