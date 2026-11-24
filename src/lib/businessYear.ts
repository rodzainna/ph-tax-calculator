import type { BusinessIncome } from '../engine/annualReturn.ts'
import { monthsWorkedInYear } from '../engine/dates.ts'
import { roundToCentavos } from '../engine/money.ts'
import { amount, checkDate, InputProblem, minIso } from './scenarioInput.ts'
import { MONTHS_PER_BUSINESS_PERIOD, type BusinessState, type FormState } from './yearForm.ts'

/** The business income for the year, as the tax engine takes it, counted up to `projectionEnd`. */
export function businessYear(form: FormState, business: BusinessState, projectionEnd: string): BusinessIncome {
  const where = 'Business'
  const perPeriod = amount(where, 'amount received', business.amount)
  checkDate(where, 'start date', business.startDate)
  checkDate(where, 'end date', business.endDate)
  const startDate = business.startDate || undefined
  const lastDay = business.endDate || undefined
  if (startDate && lastDay && lastDay < startDate) {
    throw new InputProblem(`${where}: the end date is before the start date.`)
  }
  // The amount is a rate: so much each month, quarter or year, over the months the income runs.
  const monthsCounted = monthsWorkedInYear({
    year: form.year,
    startDate,
    endDate: lastDay ? minIso(lastDay, projectionEnd) : projectionEnd,
  })
  // Expenses count only when itemizing under graduated rates. Elsewhere the rows are hidden, so a leftover value must not block the result.
  const itemizing = form.taxpayer.method === 'graduated' && business.deduction === 'itemized'
  // They run over the same months, except a yearly one, which counts once.
  const itemizedExpenses = itemizing
    ? roundToCentavos(
        business.expenses.reduce((sum, line) => {
          const value = amount(where, 'an expense amount', line.amount)
          if (line.per === 'month') return sum + value * monthsCounted
          if (line.per === 'quarter') return sum + (value * monthsCounted) / MONTHS_PER_BUSINESS_PERIOD.quarter
          return sum + value
        }, 0),
      )
    : 0
  return {
    deduction: business.deduction,
    itemizedExpenses,
    grossReceipts: roundToCentavos((perPeriod * monthsCounted) / MONTHS_PER_BUSINESS_PERIOD[business.frequency]),
    otherNonOperatingIncome: amount(where, 'other income', business.otherIncome),
    quarterlyTaxPaid: amount(where, '1701Q payments', business.quarterlyPaid),
    creditableWithholding: amount(where, 'tax withheld with a 2307', business.credit2307),
  }
}
