import CustomContributions from '@/components/employer/CustomContributions.tsx'
import DeMinimisList from '@/components/employer/DeMinimisList.tsx'
import ThirteenthMonthChoice from '@/components/employer/ThirteenthMonthChoice.tsx'
import MoreTray from '@/components/shared/MoreTray.tsx'
import PesoInput from '@/components/shared/PesoInput.tsx'
import ToggleRow from '@/components/shared/ToggleRow.tsx'
import { newDeMinimisLine, type EmployerState } from '@/lib/yearForm.ts'
import { fieldSetter } from '@/lib/fieldSetter.ts'

interface Props {
  employer: EmployerState
  /** Hands out the id for a new benefit row. */
  nextLineId: () => number
  onChange: (next: EmployerState) => void
}

/** Salary mode, below the dates: de minimis benefits, and a "More" tray for the optional figures. */
export default function EmployerSalaryDetails({ employer, nextLineId, onChange }: Props) {
  const set = fieldSetter(employer, onChange)
  const id = employer.id

  return (
    <>
      <div className="space-y-3">
        <ToggleRow
          id={`dm-on-${id}`}
          label="De minimis benefits"
          checked={employer.hasDeMinimis}
          onCheckedChange={set('hasDeMinimis')}
        />
        {employer.hasDeMinimis ? (
          <DeMinimisList
            lines={employer.deMinimis}
            nextLineId={nextLineId}
            onChange={set('deMinimis')}
            // Removing the last benefit switches the section off and keeps a blank row for next time.
            onTurnOff={() =>
              onChange({ ...employer, hasDeMinimis: false, deMinimis: [newDeMinimisLine(nextLineId())] })
            }
          />
        ) : null}
      </div>

      <MoreTray>
        <ThirteenthMonthChoice
          mode={employer.thirteenthMode}
          custom={employer.thirteenthCustom}
          onModeChange={set('thirteenthMode')}
          onCustomChange={set('thirteenthCustom')}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <PesoInput label="Tax withheld" value={employer.taxWithheld} onChange={set('taxWithheld')} />
          <PesoInput label="Other pay" value={employer.otherPay} onChange={set('otherPay')} />
          <PesoInput label="Bonuses" value={employer.otherBenefits} onChange={set('otherBenefits')} />
        </div>

        <div className="space-y-3">
          <ToggleRow
            id={`contrib-${id}`}
            tone="plain"
            label="Enter SSS, PhilHealth, Pag-IBIG myself"
            checked={employer.contributionsMode === 'custom'}
            onCheckedChange={(on) => set('contributionsMode')(on ? 'custom' : 'estimate')}
          />
          {employer.contributionsMode === 'custom' ? (
            <CustomContributions value={employer.customContributions} onChange={set('customContributions')} />
          ) : null}
        </div>
      </MoreTray>
    </>
  )
}
