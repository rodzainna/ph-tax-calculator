import { Plus, Trash2 } from 'lucide-react'
import PesoInput from '@/components/shared/PesoInput.tsx'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** What every row has: a name, an amount typed as text, and how often it comes up. */
export interface Line<Per extends string> {
  id: number
  label: string
  amount: string
  per: Per
}

/** One row: name and amount, then how often, and delete. On a phone, delete sits at the top right. */
const ROW =
  'grid grid-cols-[minmax(0,1fr)_7.5rem_2.5rem] items-end gap-x-2 gap-y-2 max-sm:border-b max-sm:border-dashed max-sm:border-foreground/20 max-sm:pb-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_auto]'

interface Props<Per extends string, L extends Line<Per>> {
  lines: L[]
  onChange: (lines: L[]) => void
  /** A blank row for the Add button. */
  newLine: () => L
  perOptions: Array<Option<Per>>
  /** Starts the id of each field in a row, so "dm" gives "dm-label-3". */
  idPrefix: string
  /** What a row is, lowercase and singular, such as "benefit". It names the fields and buttons. */
  noun: string
  /** Called with the row when the only row is removed. */
  onRemoveLast: (line: L) => void
  /** Replaces "Remove this {noun}" on the only row, when removing it does more than that. */
  removeLastLabel?: string
}

/** Rows of a name, an amount and how often, with delete on each and a button to add another. */
export default function LineList<Per extends string, L extends Line<Per>>({
  lines,
  onChange,
  newLine,
  perOptions,
  idPrefix,
  noun,
  onRemoveLast,
  removeLastLabel,
}: Props<Per, L>) {
  const setLine = (id: number, patch: Partial<Omit<Line<Per>, 'id'>>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const onlyOne = lines.length === 1
  const title = noun.charAt(0).toUpperCase() + noun.slice(1)

  return (
    <>
      {lines.map((line, index) => (
        <div key={line.id} role="group" aria-label={`${title} ${index + 1}`} className={ROW}>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor={`${idPrefix}-label-${line.id}`} className={index > 0 ? 'sm:sr-only' : undefined}>
              {title} name
            </Label>
            <Input
              id={`${idPrefix}-label-${line.id}`}
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
            id={`${idPrefix}-per-${line.id}`}
            label="Per"
            hideLabelOnWide={index > 0}
            value={line.per}
            onChange={(per) => setLine(line.id, { per })}
            options={perOptions}
            wrapperClassName="col-span-2 sm:col-span-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 max-sm:col-start-3 max-sm:row-start-1"
            aria-label={onlyOne && removeLastLabel ? removeLastLabel : `Remove this ${noun}`}
            onClick={() => (onlyOne ? onRemoveLast(line) : onChange(lines.filter((l) => l.id !== line.id)))}
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
        onClick={() => onChange([...lines, newLine()])}
      >
        <Plus /> Add another {noun}
      </Button>
    </>
  )
}
