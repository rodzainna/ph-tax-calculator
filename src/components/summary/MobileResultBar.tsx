import { ChevronDown } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  /** What the figure is, e.g. "Take-home pay per month". */
  label: string
  /** The figure. */
  children: ReactNode
  /** The id of the element with the full result. The bar hides while it is on screen, and its button scrolls to it. */
  targetId: string
}

/** A bottom bar that keeps the figure in view on a phone, hidden while the full result is on screen. */
export default function MobileResultBar({ label, children, targetId }: Props) {
  const [targetVisible, setTargetVisible] = useState(false)

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting), { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [targetId])

  if (targetVisible) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      {/* The button moves to its own line rather than sit under a very long figure. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-net">{children}</p>
        </div>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Payslip <ChevronDown />
        </Button>
      </div>
    </div>
  )
}
