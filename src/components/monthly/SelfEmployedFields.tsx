import PesoInput from '@/components/shared/PesoInput.tsx'
import ToggleRow from '@/components/shared/ToggleRow.tsx'

export interface SelfEmployedValues {
  paysSss: boolean
  paysPhilhealth: boolean
  pagibig: string
}

interface Props {
  values: SelfEmployedValues
  onChange: (patch: Partial<SelfEmployedValues>) => void
}

/** SSS, PhilHealth and Pag-IBIG are optional for the self-employed, so they start off. */
export default function SelfEmployedFields({ values, onChange }: Props) {
  return (
    <div className="space-y-4 border-t border-dashed border-foreground/25 pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Contributions · optional
      </p>
      <ToggleRow
        id="m-sss"
        tone="bare"
        label="I pay SSS"
        description="Worked out from your monthly income."
        checked={values.paysSss}
        onCheckedChange={(paysSss) => onChange({ paysSss })}
      />
      <ToggleRow
        id="m-ph"
        tone="bare"
        label="I pay PhilHealth"
        description="Worked out from your monthly income."
        checked={values.paysPhilhealth}
        onCheckedChange={(paysPhilhealth) => onChange({ paysPhilhealth })}
      />
      <PesoInput
        label="Pag-IBIG"
        description="Monthly — the amount you choose to put in."
        value={values.pagibig}
        onChange={(pagibig) => onChange({ pagibig })}
      />
    </div>
  )
}
