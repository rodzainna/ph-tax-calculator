import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/** Shown for any address that is not a page of the site. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <p className="font-mono text-5xl font-semibold tracking-tight text-primary">404</p>
      <h1 className="text-xl font-semibold">That page does not exist</h1>
      <p className="text-sm text-muted-foreground">The link may be old or mistyped. The calculators are one tap away.</p>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link to="/">Monthly</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/year">Annual</Link>
        </Button>
      </div>
    </div>
  )
}
