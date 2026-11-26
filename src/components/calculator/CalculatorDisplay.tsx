import { Delete } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { MAX_DIGITS } from '@/lib/calc.ts'

/** How wide one character of the mono font is, in ems of its own size. */
const CHARACTER_EMS = 0.6

interface Props {
  /** The running line, such as "1,200 + 350". */
  expression: string
  /** The number or the error message. */
  text: string
  isError: boolean
  /** The last paste was not an amount the calculator can take. */
  pasteRefused: boolean
  onBackspace: () => void
  /** The calculator's width in pixels. The line and its text change size with it. */
  width: number
}

/** The running line, the number under it and the backspace button. */
export default function CalculatorDisplay({ expression, text, isError, pasteRefused, onBackspace, width }: Props) {
  const line = useRef<HTMLDivElement>(null)

  // A long running line scrolls so the newest value stays in view.
  useEffect(() => {
    if (line.current) line.current.scrollLeft = line.current.scrollWidth
  }, [expression, pasteRefused, width])

  return (
    <div className="relative shrink-0">
      <div className="rounded-[12px] bg-muted/50 px-3 py-1 text-right">
        {pasteRefused ? (
          // It wraps in a very narrow window rather than being cut off.
          <p role="alert" className="min-h-5 text-xs leading-5 text-destructive">
            Enter an amount up to {MAX_DIGITS} digits
          </p>
        ) : (
          <div
            ref={line}
            title={expression}
            className="h-5 overflow-x-auto whitespace-nowrap font-mono text-[clamp(0.75rem,5.2cqw,1rem)] leading-5 text-muted-foreground tabular-nums [mask-image:linear-gradient(to_right,transparent,black_1.5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <span className="inline-block min-w-full">{expression}</span>
          </div>
        )}
        {/* Only the number is announced. The left padding keeps a long one clear of the backspace button. */}
        <output className="@container block pl-6">
          {isError ? (
            <span className="block text-sm font-semibold leading-8 text-destructive">{text}</span>
          ) : (
            // A long number is scaled down to fit, because a cut-off amount would read as a different one. The cqh (of
            // the calculator's height) keeps it from squeezing the keys of a short one.
            <span
              className="block whitespace-nowrap font-mono font-semibold leading-[1.1] tracking-tight tabular-nums [font-size:min(2.25rem,max(1.5rem,min(15cqi,7cqh)),calc(100cqi/var(--number-ems)))]"
              style={{ '--number-ems': text.length * CHARACTER_EMS } as CSSProperties}
            >
              {text}
            </span>
          )}
        </output>
      </div>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="Backspace"
        title="Backspace"
        className="absolute bottom-1.5 left-1.5 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Delete className="size-4" aria-hidden />
      </button>
    </div>
  )
}
