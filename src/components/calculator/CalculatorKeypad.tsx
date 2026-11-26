import type { CalcKey, Operator } from '@/lib/calc.ts'
import { cn } from '@/lib/utils'

/** Four across, laid out like a phone's calculator. */
const KEYS: CalcKey[] = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '=']

type KeyKind = 'digit' | 'function' | 'operator' | 'equals'

/** The keys that are not digits. */
const KINDS: Partial<Record<CalcKey, KeyKind>> = {
  C: 'function',
  '±': 'function',
  '%': 'function',
  '÷': 'operator',
  '×': 'operator',
  '−': 'operator',
  '+': 'operator',
  '=': 'equals',
}

const KIND_CLASS: Record<KeyKind, string> = {
  digit: 'bg-muted text-foreground hover:bg-muted/70',
  function: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  operator: 'bg-gradient-to-br from-brand-teal to-brand-navy-mid text-white hover:brightness-110',
  equals: 'bg-gradient-to-br from-brand-coral to-brand-coral-deep text-white hover:brightness-105',
}

/** The operator waiting for its second number is shown inverted. */
const PENDING_CLASS = 'bg-white text-primary ring-2 ring-primary'

/** Names for the keys whose symbol a screen reader may not say clearly. */
const NAMES: Partial<Record<CalcKey, string>> = {
  C: 'Clear',
  '±': 'Plus or minus',
  '%': 'Percent',
  '÷': 'Divide',
  '×': 'Multiply',
  '−': 'Subtract',
  '+': 'Add',
  '=': 'Equals',
  '.': 'Decimal point',
}

interface Props {
  pending: Operator | null
  onPress: (key: CalcKey) => void
}

/** The keys. They stretch to fill the space they are given. */
export default function CalculatorKeypad({ pending, onPress }: Props) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-2">
      {KEYS.map((key) => {
        const kind = KINDS[key] ?? 'digit'
        const isPending = key === pending
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPress(key)}
            aria-label={NAMES[key]}
            aria-pressed={kind === 'operator' ? isPending : undefined}
            className={cn(
              'min-h-0 rounded-full text-[clamp(1.125rem,8cqw,2rem)] font-medium transition-[background-color,transform,filter] duration-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
              isPending ? PENDING_CLASS : KIND_CLASS[kind],
              key === '0' && 'col-span-2',
            )}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
