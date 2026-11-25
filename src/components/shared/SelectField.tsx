import { useId } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<Option<T>>
  /** A visible label. Leave out and pass `ariaLabel` when the field sits beside another that already has one. */
  label?: string
  ariaLabel?: string
  /** On a single-line row under a first row that shows the label, keep it for screen readers only. */
  hideLabelOnWide?: boolean
  id?: string
  className?: string
  /** Classes for the wrapper around the label and the dropdown, e.g. to span grid columns. */
  wrapperClassName?: string
}

/** A labelled dropdown in the compact size used across the forms. */
export default function SelectField<T extends string>({
  value,
  onChange,
  options,
  label,
  ariaLabel,
  hideLabelOnWide,
  id,
  className,
  wrapperClassName,
}: Props<T>) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {label ? (
        <Label htmlFor={fieldId} className={hideLabelOnWide ? '@min-[26rem]:sr-only' : undefined}>
          {label}
        </Label>
      ) : null}
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger size="sm" id={fieldId} aria-label={ariaLabel} className={className ?? 'w-full'}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
