import PesoInput from '@/components/shared/PesoInput.tsx'
import ToggleRow from '@/components/shared/ToggleRow.tsx'
import { benefitsCeilingFor } from '@/engine/compensationTax.ts'
import { formatPesoWhole } from '@/lib/peso.ts'

export interface EmployeeValues {
  allowance: string
  deMinimis: string
  /** The yearly 13th month and bonuses. */
  bonus: string
  minimumWage: boolean
}

interface Props {
  year: number
  values: EmployeeValues
  onChange: (patch: Partial<EmployeeValues>) => void
}

/** The rest of an employee's pay. Every field is always visible. */
export default function EmployeeFields({ year, values, onChange }: Props) {
  return (
    <>
      <PesoInput
        label="Taxable allowances"
        description="Monthly — e.g. transportation, communication, commissions, taxable OT."
        value={values.allowance}
        onChange={(allowance) => onChange({ allowance })}
      />
      <PesoInput
        label="Non-taxable allowances"
        description="Monthly — de minimis benefits like rice subsidy, laundry, medical."
        value={values.deMinimis}
        onChange={(deMinimis) => onChange({ deMinimis })}
      />
      <PesoInput
        label="13th month pay & bonuses"
        description={`Yearly total. The first ${formatPesoWhole(benefitsCeilingFor(year))} is tax-exempt.`}
        value={values.bonus}
        onChange={(bonus) => onChange({ bonus })}
      />
      <div className="border-t border-dashed border-foreground/25 pt-4">
        <ToggleRow
          id="m-mwe"
          tone="bare"
          label="Minimum wage earner"
          description="Statutory minimum wage is exempt from income tax."
          checked={values.minimumWage}
          onCheckedChange={(minimumWage) => onChange({ minimumWage })}
        />
      </div>
    </>
  )
}
