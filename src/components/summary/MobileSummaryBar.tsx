import { ChevronUp } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'
import AnnualInsights from '@/components/insights/AnnualInsights.tsx'
import PesoAmount from '@/components/shared/PesoAmount.tsx'
import SummaryBody from '@/components/summary/SummaryBody.tsx'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { AnnualOutcome } from '@/lib/computeScenario.ts'
import { headlineFor, type Headline } from '@/lib/headline.ts'

interface Props {
  outcome: AnnualOutcome
  /** What the figure assumes about the rest of the year, such as "Until Dec 31". */
  assumption: string
  /** The column that shows the same estimate on wide screens. It has to be focusable. */
  sideColumn: RefObject<HTMLElement | null>
}

/** Where the side column takes over: Tailwind's xl, the width that hides the bar. */
const SIDE_COLUMN_SHOWN = '(min-width: 80rem)'

const sideColumnShown = () => window.matchMedia?.(SIDE_COLUMN_SHOWN)

/** The line above the figure. With no estimate, it says whether something entered needs fixing. */
function barLabel(outcome: AnnualOutcome, headline: Headline | null): string {
  if (headline) return headline.tone === 'neutral' ? `Estimated ${headline.label.toLowerCase()}` : headline.label
  return !outcome.ok && !outcome.empty ? 'Check your entries' : 'Estimate'
}

/** Opening the sheet focuses the sheet itself. Its first control is an ⓘ, whose tip would open over the figure. */
function focusSheet(event: Event) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).focus()
}

/**
 * On narrow screens the estimate stays in view at the bottom, with the full working behind "Details".
 * It is sticky, so put it last in the page: it then stops where the page ends and never covers what follows.
 * index.css looks for `data-summary-bar` to keep a focused field from ending up behind it.
 */
export default function MobileSummaryBar({ outcome, assumption, sideColumn }: Props) {
  const headline = outcome.ok ? headlineFor(outcome.result) : null
  const [open, setOpen] = useState(false)

  // The sheet is drawn outside the bar, so hiding the bar on a wider screen leaves it open: it is closed here.
  useEffect(() => {
    const shown = open ? sideColumnShown() : undefined
    if (!shown) return
    const closeOnceShown = () => {
      if (shown.matches) setOpen(false)
    }
    shown.addEventListener('change', closeOnceShown)
    return () => shown.removeEventListener('change', closeOnceShown)
  }, [open])

  /** Closing returns the focus to Details, except once that is hidden: then the side column takes it. */
  const returnFocus = (event: Event) => {
    if (!sideColumnShown()?.matches) return
    event.preventDefault()
    sideColumn.current?.focus({ preventScroll: true })
  }

  return (
    // Edge to edge on phones, and a floating card on wider screens.
    <div
      data-summary-bar
      className="sticky bottom-0 z-40 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:bottom-3 sm:mx-0 sm:rounded-2xl sm:border sm:shadow-card xl:hidden"
    >
      <Sheet open={open} onOpenChange={setOpen}>
        {/* The button moves to its own line rather than sit under a very long figure. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* Atomic, so the figure is announced together with the line that says what it is. */}
          <div aria-live="polite" aria-atomic="true">
            <p className="text-xs text-muted-foreground">{barLabel(outcome, headline)}</p>
            <p className="text-xl font-semibold">
              {headline ? <PesoAmount value={headline.amount} size="total" plain /> : '—'}
            </p>
          </div>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Details <ChevronUp />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0"
          onOpenAutoFocus={focusSheet}
          onCloseAutoFocus={returnFocus}
        >
          <SheetHeader>
            <SheetTitle>Your estimate</SheetTitle>
          </SheetHeader>
          {/* Only this part scrolls, so the title and the close button stay in view. */}
          <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-6">
            <SummaryBody outcome={outcome} assumption={assumption} />
            <AnnualInsights outcome={outcome} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
