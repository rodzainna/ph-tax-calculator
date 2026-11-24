import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  id: string
  /** The saved date (YYYY-MM-DD), or '' when there is none. */
  value: string
  /** Shown while `value` is empty, for example January 1. */
  fallback?: string
  /** The earliest and latest date to save (YYYY-MM-DD). The date picker offers only this range. */
  min?: string
  max?: string
  /** Called only with a complete, plausible date. */
  onCommit: (iso: string) => void
}

const COMPLETE = /^\d{4}-\d{2}-\d{2}$/
/** Years before this are the half-typed ones, such as 0002 on the way to 2026. */
const EARLIEST_YEAR = '1900'

/** A date input that keeps what you type, saves only complete dates, and returns to the saved date on blur. */
export default function DateField({ id, value, fallback = '', min, max, onCommit }: Props) {
  const saved = value || fallback
  const [draft, setDraft] = useState(saved)
  const editing = useRef(false)

  // Follow outside changes (for example the year being switched) unless you are in the middle of typing.
  useEffect(() => {
    if (!editing.current) setDraft(saved)
  }, [saved])

  return (
    <Input
      id={id}
      type="date"
      min={min}
      max={max}
      value={draft}
      onFocus={() => {
        editing.current = true
      }}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        const inRange = (!min || next >= min) && (!max || next <= max)
        if (COMPLETE.test(next) && next.slice(0, 4) >= EARLIEST_YEAR && inRange) onCommit(next)
      }}
      onBlur={() => {
        editing.current = false
        setDraft(saved)
      }}
    />
  )
}
