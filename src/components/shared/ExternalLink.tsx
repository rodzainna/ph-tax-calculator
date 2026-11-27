import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** A link to another site. It opens in a new tab, and the other site is not handed this page. */
export default function ExternalLink({ className, children, ...props }: Omit<ComponentProps<'a'>, 'target' | 'rel'>) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer" className={cn('underline', className)}>
      {children}
    </a>
  )
}
