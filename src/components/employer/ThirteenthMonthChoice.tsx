import { useId } from 'react'
import PesoInput from '@/components/shared/PesoInput.tsx'
import SegmentedControl, { type SegmentOption } from '@/components/shared/SegmentedControl.tsx'
import type { ThirteenthMode } from '@/lib/yearForm.ts'

const CHOICES: Array<SegmentOption<ThirteenthMode>> = [
  { value: 'estimate', label: 'Estimate' },
  { value: 'unpaid', label: 'Not paid yet' },
  { value: 'custom', label: 'Enter amount' },
]

interface Props {
  mode: ThirteenthMode
  custom: string
  onModeChange: (mode: ThirteenthMode) => void
  onCustomChange: (amount: string) => void
}

/** How the 13th month is treated: estimated from basic pay, left out until paid, or typed in. */
export default function ThirteenthMonthChoice({ mode, custom, onModeChange, onCustomChange }: Props) {
  const headingId = useId()
  return (
    <div className="space-y-2">
      <p id={headingId} className="text-sm font-medium">
        13th month
      </p>
      <SegmentedControl labelledBy={headingId} value={mode} onChange={onModeChange} options={CHOICES} />
      {mode === 'custom' ? <PesoInput label="13th month received" value={custom} onChange={onCustomChange} /> : null}
    </div>
  )
}
