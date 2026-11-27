import { cva } from 'class-variance-authority'
import { useId, type ReactNode } from 'react'
import InfoTip from '@/components/shared/InfoTip.tsx'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LARGEST_AMOUNT } from '@/lib/peso.ts'
import { usePesoField } from '@/lib/usePesoField.ts'
import { cn } from '@/lib/utils'

const inputStyle = cva('text-right font-mono tabular-nums', {
  variants: {
    size: {
      default: 'pl-7',
      soft: 'border-primary/35 bg-accent/50 pl-7 font-medium hover:border-primary/55',
      hero: 'h-12 border-primary/40 bg-accent/60 pl-9 text-2xl font-semibold tracking-tight shadow-[inset_0_1px_2px_rgb(32_46_84/0.06)] hover:border-primary/60 md:h-12 md:text-2xl',
      compact: 'h-8 pl-7 text-sm md:h-8 md:text-sm',
    },
  },
  defaultVariants: { size: 'default' },
})

const signStyle = cva('pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 leading-none text-brand-gradient', {
  variants: {
    size: { default: '', soft: 'font-medium', hero: 'text-lg font-semibold', compact: 'text-sm' },
  },
  defaultVariants: { size: 'default' },
})

/** The most characters a compact field can show at its usual width. */
const FITS_USUAL_WIDTH = 12

/** A compact field widens only for an amount its usual width would cut off, so the label beside it keeps its room. */
const compactWidth = (value: string): string => (value.length > FITS_USUAL_WIDTH ? 'w-40' : 'w-36')

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  placeholder?: string
  /** 'hero' for the one main field on a page, 'soft' for key fields in a form. */
  emphasis?: 'hero' | 'soft'
  /** Put the cursor in the field when the page opens. */
  autoFocus?: boolean
  /** A smaller field with the label on its left, for a row inside a summary. */
  compact?: boolean
  /** A short explanation shown in an ⓘ next to the label (compact fields), instead of a line under the field. */
  info?: string
  /** A line of help between the label and the field, such as what to put here. */
  description?: string
  /** On a single-line row under a first row that shows the label, keep it for screen readers only. */
  hideLabelOnWide?: boolean
}

/** A labelled peso field. */
export default function PesoInput({
  label,
  value,
  onChange,
  hint,
  placeholder = '0.00',
  emphasis,
  autoFocus,
  compact,
  info,
  description,
  hideLabelOnWide,
}: Props) {
  const id = useId()
  const { inputRef, invalid, handleChange, handlePaste, preventDrag, handleFocus, handleBlur } = usePesoField(
    value,
    onChange,
  )
  const size = compact ? 'compact' : (emphasis ?? 'default')
  const describedBy = [hint && `${id}-hint`, invalid && `${id}-error`].filter(Boolean).join(' ')

  const field = (
    <div className={compact ? cn('relative shrink-0', compactWidth(value)) : 'relative'}>
      <span className={signStyle({ size })}>₱</span>
      <Input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onPaste={handlePaste}
        onDragStart={preventDrag}
        onDrop={preventDrag}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        className={inputStyle({ size })}
      />
    </div>
  )
  const hintText = hint ? (
    <p id={`${id}-hint`} className="text-xs text-muted-foreground">
      {hint}
    </p>
  ) : null
  const errorText = invalid ? (
    <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
      Enter a valid amount up to {LARGEST_AMOUNT}
    </p>
  ) : null

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1">
            <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
              {label}
            </Label>
            {info ? <InfoTip about={label}>{info}</InfoTip> : null}
          </span>
          {field}
        </div>
        {errorText}
        {hintText}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label
        htmlFor={id}
        className={cn(emphasis && 'font-semibold text-foreground', hideLabelOnWide && '@min-[26rem]:sr-only')}
      >
        {label}
      </Label>
      {description ? <p className="text-xs leading-snug text-muted-foreground">{description}</p> : null}
      {field}
      {errorText}
      {hintText}
    </div>
  )
}
