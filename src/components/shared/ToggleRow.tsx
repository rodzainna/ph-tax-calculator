import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 'muted' on a white card, 'plain' inside the grey "More" tray, 'bare' with no box at all. */
  tone?: 'muted' | 'plain' | 'bare'
  /** A line of help under the label. */
  description?: string
}

/** A label with a switch, in a soft rounded row. */
export default function ToggleRow({ id, label, checked, onCheckedChange, tone = 'muted', description }: Props) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        tone !== 'bare' && 'rounded-lg px-3 py-2',
        tone === 'muted' && 'bg-muted/50',
        tone === 'plain' && 'bg-background',
      )}
    >
      <div className="space-y-0.5">
        <Label htmlFor={id} className={cn('text-sm', tone === 'bare' ? 'font-semibold' : 'font-normal')}>
          {label}
        </Label>
        {description ? <p className="text-xs leading-snug text-muted-foreground">{description}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
