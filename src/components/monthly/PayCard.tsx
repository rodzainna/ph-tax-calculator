import type { ReactNode } from 'react'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  isSelfEmployed: boolean
  basic: string
  onBasicChange: (value: string) => void
  /** Skip on touch screens, where it would pop up the keyboard and cover the page. */
  autoFocus: boolean
  /** The fields that depend on the taxpayer type. */
  children: ReactNode
}

/** The card with the pay inputs: the main figure on top, the rest for the taxpayer type below it. */
export default function PayCard({ isSelfEmployed, basic, onBasicChange, autoFocus, children }: Props) {
  return (
    <SoftCard accent className="md:sticky md:top-24">
      <CardHeader>
        <CardTitle>{isSelfEmployed ? 'Monthly income' : 'Your pay'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isSelfEmployed
            ? 'Enter what you receive each month. No contributions are taken off until you add them.'
            : "Enter what's on your payslip. Contributions are computed automatically."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PesoInput
          label={isSelfEmployed ? 'Income received per month' : 'Basic salary per month'}
          value={basic}
          onChange={onBasicChange}
          emphasis="hero"
          autoFocus={autoFocus}
          description={isSelfEmployed ? 'Before any tax your clients withhold.' : undefined}
        />
        {children}
      </CardContent>
    </SoftCard>
  )
}
