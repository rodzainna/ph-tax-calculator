import type { ReactNode } from 'react'

/**
 * Stat tiles side by side. A tile is never narrower than its figure: on a very narrow screen one moves to a second
 * line, since a clipped amount would read as a different one.
 */
export default function StatRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 *:min-w-min *:flex-1">{children}</div>
}
