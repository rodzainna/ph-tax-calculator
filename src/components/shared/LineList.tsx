import { Plus, Trash2 } from 'lucide-react'
import PesoInput from '@/components/shared/PesoInput.tsx'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** What every row has: a name, an amount typed as text, and how often it comes up. */
export interface Line<Per extends string> {
  id: number
  label: string
  amount: string
  per: Per
}

/**
 * One row. With at least 26rem of its own width it is a single line: name, amount, how often, delete. In less, the name
 * and delete come first, and the amount and how often go under them, on separate lines if both don't fit. The row goes
 * by its own width because a wider screen can give it less room.
 */
const ROW = cn(
  // Lined up from the top, so a message under the amount does not move the other fields.
  'grid grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-2',
  'border-b border-dashed border-foreground/20 pb-3',
  // The amount column is wider below md, where fields use larger text.
  '[--amount-column:11rem] md:[--amount-column:10rem]',
  '@min-[26rem]:grid-cols-[minmax(0,1fr)_var(--amount-column)_7rem_auto] @min-[26rem]:border-0 @min-[26rem]:pb-0',
)

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
        <div key={line.id} className="@container">
          <div role="group" aria-label={`${title} ${index + 1}`} className={ROW}>
            <div className="space-y-1">
              <Label
                htmlFor={`${idPrefix}-label-${line.id}`}
                className={index > 0 ? '@min-[26rem]:sr-only' : undefined}
              >
                {/* The column can be too narrow for both words, so only screen readers get the second. */}
                {title} <span className="sr-only">name</span>
              </Label>
              <Input
                id={`${idPrefix}-label-${line.id}`}
                placeholder="Name"
                value={line.label}
                onChange={(e) => setLine(line.id, { label: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex flex-wrap items-start gap-2 @min-[26rem]:contents">
              <div className="flex-[999_1_11rem]">
                <PesoInput
                  label="Amount"
                  hideLabelOnWide={index > 0}
                  value={line.amount}
                  onChange={(amount) => setLine(line.id, { amount })}
                />
              </div>
              <SelectField
                id={`${idPrefix}-per-${line.id}`}
                label="Per"
                hideLabelOnWide={index > 0}
                value={line.per}
                onChange={(per) => setLine(line.id, { per })}
                options={perOptions}
                wrapperClassName="flex-[1_0_7rem]"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              // The button has no label, so it drops by a label's height wherever the fields beside it show one.
              className={cn(
                'col-start-2 row-start-1 mt-4.5 size-10 @min-[26rem]:col-start-auto @min-[26rem]:row-start-auto',
                index > 0 && '@min-[26rem]:mt-0',
              )}
              aria-label={onlyOne && removeLastLabel ? removeLastLabel : `Remove this ${noun}`}
              onClick={() => (onlyOne ? onRemoveLast(line) : onChange(lines.filter((l) => l.id !== line.id)))}
            >
              <Trash2 />
            </Button>
          </div>
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
