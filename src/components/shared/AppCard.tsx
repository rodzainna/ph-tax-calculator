import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CardProps = ComponentProps<typeof Card>

/** The coral-to-teal bar along the top edge of a card. */
const ACCENT_BAR =
  'relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-brand-coral before:via-brand-blush before:to-brand-teal-bright'

/** The standard content card: rounded, with a shadow that deepens on hover. */
export function SoftCard({ accent, className, ...props }: CardProps & { accent?: boolean }) {
  return (
    <Card
      size="sm"
      className={cn(
        'rounded-2xl border-0 shadow-card transition-shadow hover:shadow-card-hover',
        accent && ACCENT_BAR,
        className,
      )}
      {...props}
    />
  )
}

/**
 * The payslip: accent bar on top and a scalloped bottom edge (drawn in index.css as `.receipt`). It is navy in both
 * themes, so that the result stands out.
 */
export function ReceiptCard({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    // `dark` gives everything inside the dark theme's colours. It sits on a wrapper because `dark:` styles reach
    // only what is inside it.
    <div className="dark result-navy">
      <div className={cn('receipt relative rounded-t-2xl p-5 pb-6 text-sm text-card-foreground', className)} {...props}>
        {/* The bar is clipped by its own rounded-top box, since the whole card cannot clip: the scallops hang outside it. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-4 overflow-hidden rounded-t-2xl">
          <span className="block h-1 bg-gradient-to-r from-brand-coral via-brand-blush to-brand-teal-bright" />
        </span>
        {children}
      </div>
    </div>
  )
}

/** A dashed rule between the parts of a payslip. */
export function ReceiptRule() {
  return <div aria-hidden className="border-t border-dashed border-foreground/25" />
}
