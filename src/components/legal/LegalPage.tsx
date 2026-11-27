import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
}

interface PageProps extends SectionProps {
  /** The day this page's own wording last changed, such as "27 November 2026". */
  lastUpdated: string
}

/** The layout the Privacy and Terms pages share: the title, the date and the text. */
export default function LegalPage({ title, lastUpdated, children }: PageProps) {
  return (
    <article className="mx-auto max-w-2xl space-y-3 text-[15px] leading-relaxed">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      {children}
    </article>
  )
}

/** One numbered section. The number is part of the title. */
export function LegalSection({ title, children }: SectionProps) {
  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}
