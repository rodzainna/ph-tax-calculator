import { Briefcase, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { SoftCard } from '@/components/shared/AppCard.tsx'
import CardHeading from '@/components/shared/CardHeading.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import { CardContent } from '@/components/ui/card'

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
  const Icon = isSelfEmployed ? Briefcase : Wallet
  return (
    <SoftCard accent className="md:sticky md:top-24">
      <CardHeading
        badge={<Icon className="size-5" />}
        title={isSelfEmployed ? 'Monthly income' : 'Your pay'}
        description={
          isSelfEmployed ? 'Contributions are off until you add them.' : 'Contributions are computed for you.'
        }
      />
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
