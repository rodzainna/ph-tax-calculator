import { useEffect } from 'react'
import SelectField, { type Option } from '@/components/shared/SelectField.tsx'
import YearSelect from '@/components/shared/YearSelect.tsx'
import type { TaxMethod, Taxpayer, TaxpayerType } from '@/lib/taxpayer.ts'

interface Props {
  idPrefix: string
  year: number
  years: number[]
  onYearChange: (year: number) => void
  taxpayer: Taxpayer
  onTaxpayerChange: (next: Taxpayer) => void
  /** Which types to offer. Monthly has no mixed income, Annual does. */
  types?: TaxpayerType[]
}

const TYPE_OPTIONS: Array<Option<TaxpayerType>> = [
  { value: 'employee', label: 'Employee' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'mixed', label: 'Mixed income' },
]

const DEFAULT_TYPES: TaxpayerType[] = ['employee', 'self-employed']

const METHOD_OPTIONS: Array<Option<TaxMethod>> = [
  { value: 'graduated', label: 'Graduated rates' },
  { value: 'eight-percent', label: '8% flat rate' },
]

/** Tax year, then the kind of earner, then (unless employee) graduated or 8%. */
export default function TaxpayerFields({ idPrefix, year, years, onYearChange, taxpayer, onTaxpayerChange, types = DEFAULT_TYPES }: Props) {
  // If the page does not offer the current type (for example mixed income on a page without it), fall back to the first one it does.
  useEffect(() => {
    if (!types.includes(taxpayer.type)) onTaxpayerChange({ ...taxpayer, type: types[0] })
  }, [types, taxpayer, onTaxpayerChange])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <YearSelect id={`${idPrefix}-year`} value={year} years={years} onChange={onYearChange} />
      <SelectField
        id={`${idPrefix}-type`}
        label="I am"
        value={taxpayer.type}
        onChange={(type) => onTaxpayerChange({ ...taxpayer, type })}
        options={TYPE_OPTIONS.filter((o) => types.includes(o.value))}
        className="w-36"
      />
      {taxpayer.type !== 'employee' ? (
        <SelectField
          id={`${idPrefix}-method`}
          label="Tax option"
          value={taxpayer.method}
          onChange={(method) => onTaxpayerChange({ ...taxpayer, method })}
          options={METHOD_OPTIONS}
          className="w-44"
        />
      ) : null}
    </div>
  )
}
