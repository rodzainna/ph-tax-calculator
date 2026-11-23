import SelectField from '@/components/shared/SelectField.tsx'

interface Props {
  id: string
  value: number
  years: number[]
  onChange: (year: number) => void
}

/** The "Tax year" picker used at the top of each calculator. */
export default function YearSelect({ id, value, years, onChange }: Props) {
  return (
    <SelectField
      id={id}
      label="Tax year"
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={years.map((y) => ({ value: String(y), label: String(y) }))}
      className="w-24"
    />
  )
}
