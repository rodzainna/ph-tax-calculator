import { Link } from 'react-router'

const LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

interface Props {
  /** Opens the analytics question again. Left out when the site has no analytics. */
  onAnalyticsChoice?: () => void
}

/** The notes under every page, and the links to the legal pages. */
export default function SiteFooter({ onAnalyticsChoice }: Props) {
  return (
    <footer className="mx-auto w-full max-w-6xl space-y-1 px-4 pb-8 pt-4 text-xs text-muted-foreground">
      <p className="max-w-3xl leading-relaxed">
        Estimates only, for planning purposes. Actual withholding may differ based on your employer's payroll setup.
        Consult the BIR or a licensed accountant for official computations.
      </p>
      <p>Nothing you type leaves your browser.</p>
      <nav aria-label="Footer" className="flex gap-x-4">
        {LINKS.map(({ to, label }) => (
          // The padding makes each link tall enough to tap.
          <Link key={to} to={to} className="inline-block py-2 underline">
            {label}
          </Link>
        ))}
        {onAnalyticsChoice && (
          <button type="button" onClick={onAnalyticsChoice} className="py-2 underline">
            Analytics choice
          </button>
        )}
      </nav>
    </footer>
  )
}
