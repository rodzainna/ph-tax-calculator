import DateField from '@/components/shared/DateField.tsx'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { suggestedEnd } from '@/lib/suggestedEnd.ts'

interface Props {
  /** Makes the field ids unique, for example the employer id. */
  idSuffix: string | number
  year: number
  /** The date the figures are counted to. The end date starts here when the range stops being open-ended. */
  asOf: string
  startDate: string
  endDate: string
  onChange: (patch: { startDate?: string; endDate?: string }) => void
  /** What the switch says, for example "Still working". */
  openEndedLabel: string
}

/** "From" and "To" with an open-ended switch, as two grid cells. A blank start is Jan 1; a blank end is "Present". */
export default function DateRangeFields({ idSuffix, year, asOf, startDate, endDate, onChange, openEndedLabel }: Props) {
  const jan1 = `${year}-01-01`
  const dec31 = `${year}-12-31`
  const fromId = `from-${idSuffix}`
  const toId = `to-${idSuffix}`
  const presentId = `present-${idSuffix}`

  return (
    <>
      <div className="space-y-1">
        <div className="flex h-5 items-center">
          <Label htmlFor={fromId}>From</Label>
        </div>
        <DateField
          id={fromId}
          value={startDate}
          fallback={jan1}
          min={jan1}
          max={dec31}
          onCommit={(iso) => onChange({ startDate: iso === jan1 ? '' : iso })}
        />
      </div>
      <div className="space-y-1">
        <div className="flex h-5 items-center justify-between gap-2">
          <Label htmlFor={toId}>To</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor={presentId} className="text-xs font-normal text-muted-foreground">
              {openEndedLabel}
            </Label>
            <Switch
              id={presentId}
              size="sm"
              checked={endDate === ''}
              onCheckedChange={(on) => onChange({ endDate: on ? '' : suggestedEnd(year, asOf, startDate) })}
            />
          </div>
        </div>
        {endDate === '' ? (
          // A real, read-only field, so the "To" label belongs to something.
          <Input id={toId} readOnly value="Present" className="border-dashed text-muted-foreground" />
        ) : (
          <DateField id={toId} value={endDate} min={jan1} max={dec31} onCommit={(iso) => onChange({ endDate: iso })} />
        )}
      </div>
    </>
  )
}
