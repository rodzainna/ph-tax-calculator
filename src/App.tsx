import { useRef, useState } from 'react'
import { Route, Routes } from 'react-router'
import FloatingCalculator from '@/components/calculator/FloatingCalculator.tsx'
import ConsentBanner from '@/components/ConsentBanner.tsx'
import SiteFooter from '@/components/SiteFooter.tsx'
import SiteHeader from '@/components/SiteHeader.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ANALYTICS_ENABLED } from '@/config.ts'
import { afterHeaderButton, type CalculatorMode } from '@/lib/calcMode.ts'
import { useConsent } from '@/lib/useConsent.ts'
import { useOpenAtTop } from '@/lib/useOpenAtTop.ts'
import { usePageMeta } from '@/lib/usePageMeta.ts'
import About from '@/pages/About.tsx'
import Monthly from '@/pages/Monthly.tsx'
import MyYear from '@/pages/MyYear.tsx'
import NotFound from '@/pages/NotFound.tsx'
import Privacy from '@/pages/Privacy.tsx'
import Terms from '@/pages/Terms.tsx'

export default function App() {
  const [calculator, setCalculator] = useState<CalculatorMode>('closed')
  const page = useRef<HTMLElement>(null)
  useOpenAtTop(page)
  usePageMeta()
  const consent = useConsent()

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col text-foreground">
        <SiteHeader
          calculatorOpen={calculator === 'open'}
          onToggleCalculator={() => setCalculator(afterHeaderButton)}
        />
        <main ref={page} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none">
          <Routes>
            <Route path="/" element={<Monthly />} />
            <Route path="/year" element={<MyYear />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <SiteFooter onAnalyticsChoice={ANALYTICS_ENABLED ? consent.reopen : undefined} />
      </div>
      <FloatingCalculator mode={calculator} onModeChange={setCalculator} />
      {consent.asking && <ConsentBanner takeFocus={consent.reopened} onDecide={consent.decide} />}
    </TooltipProvider>
  )
}
