import { Badge } from '@/components/ui/badge'
import type { Source, SourceStatus } from '@/lib/aboutSources.ts'

const BADGE: Record<SourceStatus, 'default' | 'secondary' | 'outline'> = {
  Verified: 'default',
  Partly: 'secondary',
  'Not verified': 'outline',
}

/** One rule on the About page: how far it is confirmed, what is assumed and where to read it. */
export default function SourceItem({ topic, years, status, note, links }: Source) {
  return (
    <li className="space-y-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="inline font-medium">{topic}</h3>{' '}
          <span className="text-sm text-muted-foreground">· {years}</span>
        </div>
        <Badge variant={BADGE[status]}>{status}</Badge>
      </div>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {link.label}
          </a>
        ))}
      </p>
    </li>
  )
}
