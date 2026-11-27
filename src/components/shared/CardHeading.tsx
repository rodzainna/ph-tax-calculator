import type { ReactNode } from 'react'
import { CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  /** An icon or a number, shown in the round badge. It is decoration, so the title must say the same thing. */
  badge: ReactNode
  title: string
  description?: string
  /** A button or label at the right. */
  action?: ReactNode
}

/** The heading of an input card: a badge, the title and what the card is for, ruled off from the fields. */
export default function CardHeading({ badge, title, description, action }: Props) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 border-b border-foreground/10 pt-2">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xl leading-none font-semibold text-secondary-foreground"
          aria-hidden
        >
          {badge}
        </span>
        <div className="min-w-0">
          <CardTitle className="text-lg leading-tight group-data-[size=sm]/card:text-lg">{title}</CardTitle>
          {description && <p className="text-sm leading-tight text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </CardHeader>
  )
}
