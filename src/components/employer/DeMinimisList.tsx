import LineList from '@/components/shared/LineList.tsx'
import type { PayFrequency } from '@/engine/pay.ts'
import { RECURRENCE_OPTIONS } from '@/components/shared/recurrenceOptions.ts'
import type { Option } from '@/components/shared/SelectField.tsx'
import { newDeMinimisLine, type DeMinimisLine, type DeMinimisPer } from '@/lib/yearForm.ts'

const PER_OPTIONS: Array<Option<DeMinimisPer>> = [{ value: 'payout', label: 'Cutoff' }, ...RECURRENCE_OPTIONS]

interface Props {
  lines: DeMinimisLine[]
  /** How the salary is paid, which a new benefit starts with. */
  payFrequency: PayFrequency
  onChange: (lines: DeMinimisLine[]) => void
  /** Called when the last benefit is deleted: the section switches itself off. */
  onTurnOff: () => void
  nextLineId: () => number
}

/** The de minimis benefit rows: a name, an amount, how often, and delete. Add as many as you need. */
export default function DeMinimisList({ lines, payFrequency, onChange, onTurnOff, nextLineId }: Props) {
  return (
    <LineList
      lines={lines}
      onChange={onChange}
      newLine={() => newDeMinimisLine(nextLineId(), payFrequency)}
      perOptions={PER_OPTIONS}
      idPrefix="dm"
      noun="benefit"
      onRemoveLast={onTurnOff}
      removeLastLabel="Remove this benefit and turn de minimis off"
    />
  )
}
