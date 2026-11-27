import SourceItem from '@/components/about/SourceItem.tsx'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CONTRIBUTIONS_FIRST_YEAR } from '@/engine/rules/contributions.ts'
import { RULES_LAST_CHECKED, SOURCES } from '@/lib/aboutSources.ts'

export default function About() {
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">About &amp; sources</h1>
      <p className="text-muted-foreground">
        Free estimates for Filipino employees and freelancers. Not affiliated with the BIR, SSS, PhilHealth or Pag-IBIG.
        Contributions are estimated from {CONTRIBUTIONS_FIRST_YEAR} onward; for earlier years on the Annual page, you
        enter your own. Rules last checked {RULES_LAST_CHECKED}.
      </p>

      <SoftCard>
        <CardHeader>
          <CardTitle>
            <h2>Where the rules come from</h2>
          </CardTitle>
          <CardDescription>Verified means read in the law or the agency’s own document.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {SOURCES.map((source) => (
              <SourceItem key={source.topic} {...source} />
            ))}
          </ul>
        </CardContent>
      </SoftCard>
    </section>
  )
}
