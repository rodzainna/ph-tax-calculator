import type { ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

/** The grey "More" strip pinned to the bottom of a card. Optional fields live inside it. */
export default function MoreTray({ children, contentClassName }: { children: ReactNode; contentClassName?: string }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="-mx-(--card-spacing) -mb-(--card-spacing) mt-auto w-auto border-t bg-muted/70 px-(--card-spacing)"
    >
      <AccordionItem value="more">
        <AccordionTrigger>More</AccordionTrigger>
        <AccordionContent className={cn('space-y-3 pt-1', contentClassName)}>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
