import InfoTip from '@/components/shared/InfoTip.tsx'
import PesoAmount from '@/components/shared/PesoAmount.tsx'
import { cn } from '@/lib/utils'

/** Pink to pay, teal when overpaid, grey at zero. */
function boxColors(balance: number): string {
  if (balance > 0) return 'bg-secondary text-secondary-foreground'
  if (balance < 0) return 'bg-accent text-primary'
  return 'bg-muted text-foreground'
}

/** The last line of the payslip: what is left to pay, in its own box. */
export default function BalanceRow({ balance }: { balance: number }) {
  const over = balance < 0
  const hint = over
    ? 'Total income tax minus your credits. Your credits are more than the tax, so you paid more than you owe.'
    : 'Total income tax minus your credits: what is left to pay when you file.'

  return (
    <dl>
      <div
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-x-3 rounded-xl px-3 py-2.5',
          boxColors(balance),
        )}
      >
        <dt className="flex items-center gap-1 text-sm font-semibold">
          {over ? 'Overpaid' : 'To pay'}
          <InfoTip about={over ? 'the overpayment' : 'what is left to pay'} className="opacity-60 hover:opacity-100">
            {hint}
          </InfoTip>
        </dt>
        <dd className="ml-auto text-xl font-semibold">
          <PesoAmount value={Math.abs(balance)} size="total" plain />
        </dd>
      </div>
    </dl>
  )
}
