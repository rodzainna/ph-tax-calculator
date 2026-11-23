import { Info } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  /** What the tip says. */
  children: ReactNode
  /** What the tip is about, for screen readers: the button reads "More about {about}". */
  about: string
  /** Where the button sits, e.g. inline after a label. */
  className?: string
  contentClassName?: string
}

/** The ⓘ button with a tip: hover and focus open it, and so does a tap, which a plain tooltip ignores on a phone. */
export default function InfoTip({ children, about, className, contentClassName }: Props) {
  const [open, setOpen] = useState(false)
  const openAtPointerDown = useRef<boolean | null>(null)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`More about ${about}`}
          // Radix closes the tip on click and on pointer-down while open, so the click is handled here and toggles from the state before the press.
          onPointerDown={() => {
            openAtPointerDown.current = open
          }}
          onPointerLeave={() => {
            openAtPointerDown.current = null
          }}
          onBlur={() => {
            openAtPointerDown.current = null
          }}
          onClick={(e) => {
            e.preventDefault()
            setOpen(!(openAtPointerDown.current ?? open))
            openAtPointerDown.current = null
          }}
          className={cn('info-tip text-muted-foreground/70 hover:text-foreground', className)}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-56', contentClassName)}>{children}</TooltipContent>
    </Tooltip>
  )
}
