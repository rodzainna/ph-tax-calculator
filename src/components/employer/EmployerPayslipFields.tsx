import type { ReactNode } from 'react'
import PesoInput from '@/components/shared/PesoInput.tsx'
import type { EmployerState } from '@/lib/yearForm.ts'
import { fieldSetter } from '@/components/employer/fieldSetter.ts'

interface Props {
  employer: EmployerState
  onChange: (next: EmployerState) => void
}

/** A titled block of fields under a dashed rule. */
function FieldGroup({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <div className="space-y-4 border-t border-dashed border-foreground/25 pt-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        <p className="text-xs leading-snug text-muted-foreground">{help}</p>
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

/** Payslip mode: the year-to-date column of a payslip, then anything received that it does not show. */
export default function EmployerPayslipFields({ employer, onChange }: Props) {
  const set = fieldSetter(employer, onChange)
  return (
    <>
      <FieldGroup
        title="From your payslip"
        help="Copy the year-to-date column from your latest payslip. The rest of the period is projected at the same pace."
      >
        <PesoInput
          label="Taxable gross"
          description="After SSS, PhilHealth, Pag-IBIG"
          value={employer.ytdTaxableGross}
          onChange={set('ytdTaxableGross')}
        />
        <PesoInput
          label="Tax withheld"
          description="Withholding tax so far"
          value={employer.taxWithheld}
          onChange={set('taxWithheld')}
        />
        <PesoInput
          label="SSS"
          description="Your share, year to date"
          value={employer.ytdSss}
          onChange={set('ytdSss')}
        />
        <PesoInput
          label="PhilHealth"
          description="Your share, year to date"
          value={employer.ytdPhilhealth}
          onChange={set('ytdPhilhealth')}
        />
        <PesoInput
          label="Pag-IBIG"
          description="Your share, year to date"
          value={employer.ytdPagibig}
          onChange={set('ytdPagibig')}
        />
      </FieldGroup>
      <FieldGroup title="Also received" help="Pay that is not in the figures above. Leave blank if none.">
        <PesoInput
          label="Other pay"
          description="Taxable, outside your salary"
          value={employer.otherPay}
          onChange={set('otherPay')}
        />
        <PesoInput
          label="Bonuses"
          description="Other benefits and bonuses"
          value={employer.otherBenefits}
          onChange={set('otherBenefits')}
        />
        <PesoInput
          label="13th month"
          description="Only if already paid"
          value={employer.thirteenthCustom}
          onChange={set('thirteenthCustom')}
        />
      </FieldGroup>
    </>
  )
}
