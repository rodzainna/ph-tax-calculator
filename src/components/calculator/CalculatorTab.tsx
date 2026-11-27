import { useEffect, useRef } from 'react'
import CalculatorIcon from '@/components/shared/CalculatorIcon.tsx'

/** The tab on the right edge that brings a hidden calculator back. */
export default function CalculatorTab({ onOpen }: { onOpen: () => void }) {
  const tab = useRef<HTMLButtonElement>(null)

  // Hiding removes what had the focus, so the tab takes it.
  useEffect(() => {
    tab.current?.focus({ preventScroll: true })
  }, [])

  return (
    <button
      ref={tab}
      type="button"
      onClick={onOpen}
      aria-label="Open calculator"
      title="Open calculator"
      // Narrow until the window leaves room beside the page, so it stays off the fields and switches.
      className="group fixed right-0 top-1/2 z-40 flex h-10 w-7 -translate-y-1/2 items-center justify-center rounded-l-control border border-r-0 border-white/20 bg-brand text-white shadow-[-6px_8px_24px_-6px_rgb(32_46_84/0.55)] transition-all duration-200 hover:shadow-[-8px_10px_28px_-6px_rgb(206_106_107/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:w-10 xl:justify-start xl:pl-[3px] xl:hover:w-12"
    >
      <CalculatorIcon
        className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-110 xl:size-8"
        onDark
      />
    </button>
  )
}
