import LineList from '@/components/shared/LineList.tsx'
import { RECURRENCE_OPTIONS } from '@/components/shared/recurrenceOptions.ts'
import { newExpenseLine, type ExpenseLine } from '@/lib/yearForm.ts'

interface Props {
  lines: ExpenseLine[]
  onChange: (lines: ExpenseLine[]) => void
  nextLineId: () => number
}

/** The business expense rows for itemizing: a name, an amount, how often, and delete. Add as many as you need. */
export default function ExpenseList({ lines, onChange, nextLineId }: Props) {
  return (
    <LineList
      lines={lines}
      onChange={onChange}
      newLine={() => newExpenseLine(nextLineId())}
      perOptions={RECURRENCE_OPTIONS}
      idPrefix="exp"
      noun="expense"
      // The last expense is not removed, so there is always a row to type in: it is cleared, keeping its place and id.
      onRemoveLast={(line) => onChange([newExpenseLine(line.id)])}
    />
  )
}
