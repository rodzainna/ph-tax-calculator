import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ConsentChoice } from '@/lib/consent.ts'

interface Props {
  /** True when the visitor asked for the question again, so the keyboard should move to it. */
  takeFocus: boolean
  onDecide: (choice: ConsentChoice) => void
}

/** Asks before any analytics loads. Declining is a button next to accepting, so there is no close button. */
export default function ConsentBanner({ takeFocus, onDecide }: Props) {
  const card = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!takeFocus) return
    const opener = document.activeElement
    card.current?.focus()
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [takeFocus])

  return (
    // It sits above the phone's bottom total bar, and under the calculator window.
    <aside
      ref={card}
      tabIndex={-1}
      aria-label="Analytics choice"
      className="fixed right-4 bottom-24 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-card p-4 shadow-card-hover ring-1 ring-foreground/10 outline-none animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none sm:right-6 sm:bottom-6 sm:w-96"
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary" aria-hidden>
          <img src="/shield-check-icon.svg" alt="" className="size-5" />
        </span>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-base font-semibold">Can I count visits?</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If you accept, Google Analytics loads to show me how the site is used, such as pages viewed, scrolling and
              links clicked, and it sets cookies. What you type into the calculators is not sent to it. The site works
              the same if you decline.{' '}
              <Link to="/privacy" className="underline">
                Privacy
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="lg" onClick={() => onDecide('granted')}>
              Accept
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => onDecide('denied')}>
              Decline
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
