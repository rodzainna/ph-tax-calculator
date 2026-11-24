import { Plus, Trash2 } from 'lucide-react'
import PesoInput from '@/components/shared/PesoInput.tsx'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { newDeMinimisLine, type DeMinimisLine, type DeMinimisPer } from '@/lib/yearForm.ts'

const PER_OPTIONS: Array<Option<DeMinimisPer>> = [
  { value: 'payout', label: 'Cutoff' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
]

/** One benefit: name and amount, then how often, and delete. On a phone, delete sits at the top right. */
const ROW =
  'grid grid-cols-[minmax(0,1fr)_7.5rem_2.5rem] items-end gap-x-2 gap-y-2 max-sm:border-b max-sm:border-dashed max-sm:border-foreground/20 max-sm:pb-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_auto]'

interface Props {
  lines: DeMinimisLine[]
  onChange: (lines: DeMinimisLine[]) => void
  /** Called when the last benefit is deleted: the section switches itself off. */
  onTurnOff: () => void
  nextLineId: () => number
}

/** The de minimis benefit rows: a name, an amount, how often, and delete. Add as many as you need. */
export default function DeMinimisList({ lines, onChange, onTurnOff, nextLineId }: Props) {
  const setLine = (id: number, patch: Partial<DeMinimisLine>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const onlyOne = lines.length === 1

  return (
    <>
      {lines.map((line, index) => (
        <div key={line.id} role="group" aria-label={`Benefit ${index + 1}`} className={ROW}>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor={`dm-label-${line.id}`} className={index > 0 ? 'sm:sr-only' : undefined}>
              Benefit name
            </Label>
            <Input
              id={`dm-label-${line.id}`}
              placeholder="Name"
              value={line.label}
              onChange={(e) => setLine(line.id, { label: e.target.value })}
            />
          </div>
          <PesoInput
            label="Amount"
            hideLabelOnWide={index > 0}
            value={line.amount}
            onChange={(amount) => setLine(line.id, { amount })}
          />
          <SelectField
            id={`dm-per-${line.id}`}
            label="Per"
            hideLabelOnWide={index > 0}
            value={line.per}
            onChange={(per) => setLine(line.id, { per })}
            options={PER_OPTIONS}
            wrapperClassName="col-span-2 sm:col-span-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 max-sm:col-start-3 max-sm:row-start-1"
            aria-label={onlyOne ? 'Remove this benefit and turn de minimis off' : 'Remove this benefit'}
            onClick={() => (onlyOne ? onTurnOff() : onChange(lines.filter((l) => l.id !== line.id)))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/30 text-primary hover:bg-accent hover:text-primary"
        onClick={() => onChange([...lines, newDeMinimisLine(nextLineId())])}
      >
        <Plus /> Add another benefit
      </Button>
    </>
  )
}
