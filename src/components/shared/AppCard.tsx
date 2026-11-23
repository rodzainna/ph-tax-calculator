import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CardProps = ComponentProps<typeof Card>

/** The coral-to-teal bar along the top edge of a card. */
const ACCENT_BAR =
  'relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-brand-coral before:via-brand-blush before:to-brand-teal-bright'

/** The standard content card: rounded, with a soft shadow that lifts on hover. */
export function SoftCard({ accent, className, ...props }: CardProps & { accent?: boolean }) {
  return (
    <Card
      size="sm"
      className={cn('rounded-2xl border-0 shadow-card transition-shadow hover:shadow-card-hover', accent && ACCENT_BAR, className)}
      {...props}
    />
  )
}

/** The card that carries the answer: light, with a slowly moving gradient line around its border. */
export function HeroCard({ className, ...props }: CardProps) {
  return <Card size="sm" className={cn('border-beam rounded-2xl border-0 shadow-hero ring-0', className)} {...props} />
}

/** The payslip: accent bar on top and a scalloped bottom edge (drawn in index.css as `.receipt`). */
export function ReceiptCard({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('receipt relative rounded-t-2xl p-5 pb-6 text-sm text-card-foreground', className)} {...props}>
      {/* The bar is clipped by its own rounded-top box, since the whole card cannot clip: the scallops hang outside it. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-4 overflow-hidden rounded-t-2xl">
        <span className="block h-1 bg-gradient-to-r from-brand-coral via-brand-blush to-brand-teal-bright" />
      </span>
      {children}
    </div>
  )
}

/** A dashed rule between the parts of a payslip. */
export function ReceiptRule() {
  return <div aria-hidden className="border-t border-dashed border-foreground/25" />
}
