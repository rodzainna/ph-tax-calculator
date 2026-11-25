import { describe, expect, it } from 'vitest'
import { computeScenario } from './computeScenario.ts'
import {
  initialForm,
  newEmployer,
  soFarScenario,
  withTaxpayer,
  yearEndScenario,
  type EmployerState,
  type FormState,
} from './yearForm.ts'

/** A 2026 form with a 40,000 monthly salary and 100,000 a month of business income. */
function formWith(
  type: 'employee' | 'self-employed' | 'mixed',
  method: 'graduated' | 'eight-percent' = 'eight-percent',
): FormState {
  const base = initialForm()
  const form: FormState = {
    ...base,
    year: 2026,
    asOf: '2026-12-31',
    employers: [{ ...base.employers[0], basic: '40000' }],
    business: { ...base.business, amount: '100000', frequency: 'month' },
  }
  return withTaxpayer(form, { type, method })
}

const run = (form: FormState) => computeScenario(form, yearEndScenario(form.year))

describe('taxpayer type', () => {
  it('turns the business section on for self-employed and mixed, off for employee', () => {
    expect(withTaxpayer(initialForm(), { type: 'self-employed', method: 'eight-percent' }).business.enabled).toBe(true)
    expect(withTaxpayer(initialForm(), { type: 'mixed', method: 'eight-percent' }).business.enabled).toBe(true)
    const back = withTaxpayer(formWith('mixed'), { type: 'employee', method: 'eight-percent' })
    expect(back.business.enabled).toBe(false)
  })

  it('employee ignores business income', () => {
    const outcome = run(formWith('employee'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.form).toBe('1700')
      expect(outcome.result.business).toBeNull()
    }
  })

  it('self-employed ignores the employer and gets the 250,000 reduction on the 8%', () => {
    const outcome = run(formWith('self-employed'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.form).toBe('1701A')
      expect(outcome.result.compensation).toBeNull()
      // 1,200,000 gross, less 250,000, at 8%
      expect(outcome.result.business?.tax).toBe(76000)
    }
  })

  it('mixed income counts both and gives no 250,000 reduction', () => {
    const outcome = run(formWith('mixed'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.form).toBe('1701')
      expect(outcome.result.compensation).not.toBeNull()
      // 1,200,000 gross at 8%
      expect(outcome.result.business?.tax).toBe(96000)
    }
  })

  it('self-employed on graduated rates: 40% off gross, then the table', () => {
    const outcome = run(formWith('self-employed', 'graduated'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      // 1,200,000 - 480,000 = 720,000; tax = 22,500 + 20% x 320,000 = 86,500
      expect(outcome.result.form).toBe('1701A')
      expect(outcome.result.graduatedBusiness?.netBusinessIncome).toBe(720_000)
      expect(outcome.result.totalTaxDue).toBe(86_500)
      expect(outcome.notes.join(' ')).toMatch(/40% standard deduction/)
    }
  })

  it('mixed income on graduated rates: one computation over pay plus business', () => {
    const outcome = run(formWith('mixed', 'graduated'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.form).toBe('1701')
      expect(outcome.result.combinedTaxableIncome).toBe(
        (outcome.result.compensation?.taxableCompensation ?? 0) + 720_000,
      )
    }
  })

  it('over 3,000,000 on the 8% option points to graduated rates', () => {
    const form = formWith('self-employed')
    form.business = { ...form.business, amount: '300000' }
    const outcome = run(form)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.message).toMatch(/Choose Graduated rates/)
  })

  it('employee is unaffected by the graduated choice', () => {
    expect(run(formWith('employee', 'graduated')).ok).toBe(true)
  })
})

describe('13th month', () => {
  it('self-employed has no 13th month or benefits pool; employee does', () => {
    const self = run(formWith('self-employed'))
    const employee = run(formWith('employee'))
    expect(self.ok && employee.ok).toBe(true)
    if (self.ok && employee.ok) {
      expect(self.result.compensation).toBeNull()
      expect(self.details).toEqual([])
      expect(employee.result.compensation?.benefitsPool).toBeGreaterThan(0)
    }
  })
})

describe('itemized expenses', () => {
  const itemizedForm = (lines: Array<{ amount: string; per: 'month' | 'quarter' | 'year' }>): FormState => {
    const form = formWith('self-employed', 'graduated')
    form.business = {
      ...form.business,
      deduction: 'itemized',
      expenses: lines.map((l, i) => ({ id: 100 + i, label: '', ...l })),
    }
    return form
  }

  it('adds monthly expenses over the year and yearly ones once', () => {
    // 1,200,000 gross; 20,000 x 12 + 60,000 = 300,000 expenses -> net 900,000
    const outcome = run(
      itemizedForm([
        { amount: '20000', per: 'month' },
        { amount: '60000', per: 'year' },
      ]),
    )
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.graduatedBusiness?.deduction).toBe(300_000)
      expect(outcome.result.graduatedBusiness?.netBusinessIncome).toBe(900_000)
      // 900,000 is in the 25% bracket: 102,500 + 25% x 100,000 = 127,500
      expect(outcome.result.totalTaxDue).toBe(127_500)
    }
  })

  it('counts a quarterly expense four times over a full year', () => {
    // 15,000 x 4 = 60,000 of expenses -> net 1,140,000
    const outcome = run(itemizedForm([{ amount: '15000', per: 'quarter' }]))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.result.graduatedBusiness?.deduction).toBe(60_000)
  })

  it('treats blank expense rows as zero', () => {
    const outcome = run(itemizedForm([{ amount: '', per: 'month' }]))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.result.graduatedBusiness?.netBusinessIncome).toBe(1_200_000)
  })

  it('reports a bad expense amount', () => {
    const outcome = run(itemizedForm([{ amount: 'abc', per: 'month' }]))
    expect(outcome.ok).toBe(false)
  })

  it('ignores a bad expense left in a row that is not in use: the 40% deduction or the 8% option', () => {
    const itemized = itemizedForm([{ amount: '-5', per: 'month' }])
    const osd = { ...itemized, business: { ...itemized.business, deduction: 'osd' as const } }
    expect(run(osd).ok).toBe(true)
    const eightPercent = withTaxpayer(itemized, { type: 'self-employed', method: 'eight-percent' })
    expect(run(eightPercent).ok).toBe(true)
  })
})

describe('de minimis benefits by how often they are paid', () => {
  const benefitYear = (amount: string, per: 'payout' | 'month' | 'quarter' | 'year'): number | undefined => {
    const form = formWith('employee')
    form.employers = [{ ...form.employers[0], hasDeMinimis: true, deMinimis: [{ id: 1, label: '', amount, per }] }]
    const outcome = run(form)
    return outcome.ok ? outcome.details[0].deMinimisYear : undefined
  }

  it('adds up each frequency over a full year', () => {
    expect(benefitYear('1000', 'month')).toBe(12_000)
    expect(benefitYear('3000', 'quarter')).toBe(12_000)
    expect(benefitYear('12000', 'year')).toBe(12_000)
  })
})

describe('payslip year-to-date mode', () => {
  const ytdForm = (thirteenthCustom: string, thirteenthMode: 'estimate' | 'unpaid' | 'custom'): FormState => {
    const form = formWith('employee')
    form.employers = [
      { ...form.employers[0], mode: 'ytd', ytdTaxableGross: '400000', thirteenthMode, thirteenthCustom },
    ]
    return form
  }

  it('counts the 13th month typed in the field, whatever the rate-mode choice was', () => {
    for (const mode of ['estimate', 'unpaid', 'custom'] as const) {
      const outcome = run(ytdForm('20000', mode))
      expect(outcome.ok).toBe(true)
      if (outcome.ok) expect(outcome.details[0].thirteenthCounted).toBe(20_000)
    }
  })

  it('counts no 13th month when the field is blank', () => {
    const outcome = run(ytdForm('', 'estimate'))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.details[0].thirteenthCounted).toBe(0)
  })
})

/** A 2026 employee on 30,000 a month for the whole year, counted to December 31. */
function employee(employer: Partial<EmployerState> = {}, form: Partial<FormState> = {}): FormState {
  const base = initialForm('2026-12-31')
  return {
    ...base,
    year: 2026,
    asOf: '2026-12-31',
    employers: [{ ...base.employers[0], basic: '30000', ...employer }],
    ...form,
  }
}

/** The result of a run that is expected to work, with its first employer's details. */
function worked(form: FormState, scenario = yearEndScenario(form.year)) {
  const outcome = computeScenario(form, scenario)
  if (!outcome.ok) throw new Error(`expected a result, got: ${outcome.message}`)
  return { ...outcome, employer: outcome.details[0] }
}

const problem = (form: FormState) => {
  const outcome = computeScenario(form, yearEndScenario(form.year))
  if (outcome.ok) throw new Error('expected a problem, got a result')
  return outcome
}

describe('contributions typed by hand', () => {
  it('takes each as monthly, twice a month, or an overall total', () => {
    const { employer, result } = worked(
      employee({
        contributionsMode: 'custom',
        customContributions: {
          sss: { amount: '1000', per: 'month' },
          philhealth: { amount: '500', per: 'twice' },
          pagibig: { amount: '2400', per: 'overall' },
        },
      }),
    )
    // 1,000 x 12, 500 x 2 x 12, and 2,400 for the year
    expect(employer.contributions).toEqual({
      sss: 12_000,
      philhealth: 12_000,
      pagibig: 2_400,
      total: 26_400,
      estimated: false,
    })
    // 360,000 - 26,400 = 333,600 taxable; 15% of the 83,600 over 250,000
    expect(result.totalTaxDue).toBe(12_540)
  })
})

describe('contributions typed as an overall total, counted to a date', () => {
  it('scales the total from the months so far to the months counted', () => {
    // 1,200 for Pag-IBIG over the first six months is 2,400 for the year.
    const form = employee(
      {
        contributionsMode: 'custom',
        customContributions: {
          sss: { amount: '', per: 'month' },
          philhealth: { amount: '', per: 'month' },
          pagibig: { amount: '1200', per: 'overall' },
        },
      },
      { asOf: '2026-06-30' },
    )
    expect(worked(form).employer.contributions.pagibig).toBe(2_400)
    expect(worked(form, soFarScenario('2026-06-30')).employer.contributions.pagibig).toBe(1_200)
  })
})

describe('contributions add up to the centavo', () => {
  const parts = (c: { sss: number; philhealth: number; pagibig: number }) => c.sss + c.philhealth + c.pagibig

  it('typed monthly amounts are rounded one by one, and the total is their sum', () => {
    // 33.33 a month for the 3 months from October: 99.99 each (not 99.99000000000001), 299.97 in all.
    const entry = { amount: '33.33', per: 'month' as const }
    const { employer } = worked(
      employee({
        startDate: '2026-10-01',
        contributionsMode: 'custom',
        customContributions: { sss: entry, philhealth: entry, pagibig: entry },
      }),
    )
    expect(employer.contributions).toMatchObject({ sss: 99.99, philhealth: 99.99, pagibig: 99.99, total: 299.97 })
    expect(Math.round(parts(employer.contributions) * 100) / 100).toBe(employer.contributions.total)
  })

  it('typed monthly amounts count the same months as the estimate, a part-worked month included', () => {
    // From 16 March the job touches 10 months. SSS for 30,000 a month is 1,500, estimated or typed.
    const sss = { amount: '1500', per: 'month' as const }
    const philhealth = { amount: '375', per: 'twice' as const } // 750 a month, as two payouts
    const none = { amount: '', per: 'month' as const }
    const byHand = worked(
      employee({
        startDate: '2026-03-16',
        contributionsMode: 'custom',
        customContributions: { sss, philhealth, pagibig: none },
      }),
    )
    const estimated = worked(employee({ startDate: '2026-03-16' }))
    expect(byHand.employer.contributions).toMatchObject({ sss: 15_000, philhealth: 7_500 })
    expect(estimated.employer.contributions).toMatchObject({ sss: 15_000, philhealth: 7_500 })
  })

  it('payslip amounts scaled to the year are rounded one by one, and the total is their sum', () => {
    // 0.01 each over 7 months, scaled to 12: 0.0171 each, which is 0.02 each; the total is 0.06, not 0.05.
    const { employer } = worked(
      employee(
        { mode: 'ytd', ytdTaxableGross: '50000', ytdSss: '0.01', ytdPhilhealth: '0.01', ytdPagibig: '0.01' },
        { asOf: '2026-07-31' },
      ),
    )
    expect(employer.contributions).toMatchObject({ sss: 0.02, philhealth: 0.02, pagibig: 0.02, total: 0.06 })
  })
})

describe('estimated contributions', () => {
  it('match the monthly page for 30,000 a month: SSS 1,500, PhilHealth 750, Pag-IBIG 200', () => {
    const { employer } = worked(employee())
    expect(employer.contributions).toEqual({
      sss: 18_000,
      philhealth: 9_000,
      pagibig: 2_400,
      total: 29_400,
      estimated: true,
    })
  })

  it('take nothing off before a salary is typed, not the minimum contributions', () => {
    const { employer } = worked(employee({ basic: '', otherPay: '5000' }))
    expect(employer.contributions.total).toBe(0)
    expect(employer.totalPay).toBe(5_000)
  })

  it('are not made for a year before the rules start, and say so', () => {
    const { employer, notes, result } = worked({ ...employee(), year: 2020 })
    expect(employer.contributions.total).toBe(0)
    expect(notes.join(' ')).toContain('For 2020 contributions are not estimated automatically')
    // 360,000 taxable under the 2018 to 2022 table: 20% of the 110,000 over 250,000
    expect(result.totalTaxDue).toBe(22_000)
  })
})

describe('part of a year', () => {
  it('counts only the months from a start date', () => {
    const { employer } = worked(employee({ startDate: '2026-07-01' }))
    expect(employer.monthsCounted).toBe(6)
    expect(employer.annualBasic).toBe(180_000)
    expect(employer.thirteenthOwed).toBe(15_000)
    expect(employer.contributions.total).toBe(14_700) // 2,450 x 6
  })

  it('counts only the months up to an end date', () => {
    const { employer } = worked(employee({ endDate: '2026-03-31' }))
    expect(employer.monthsCounted).toBe(3)
    expect(employer.annualBasic).toBe(90_000)
    expect(employer.contributions.total).toBe(7_350) // 2,450 x 3
  })

  it('counts a whole month of contributions for a month that was only part worked', () => {
    // From 16 July: 5 months and 16/31 of a month worked, so contributions for July to December, six months.
    const { employer } = worked(employee({ startDate: '2026-07-16' }))
    expect(employer.monthsCounted).toBeCloseTo(5.516, 3)
    expect(employer.contributions.total).toBe(14_700)
  })

  it('counts a whole month of contributions for each month the job touches, at both ends', () => {
    // 16 Jul to 10 Sep touches July, August and September.
    expect(worked(employee({ startDate: '2026-07-16', endDate: '2026-09-10' })).employer.contributions.total).toBe(
      7_350,
    )
    // 20 Jan to 10 Feb touches January and February.
    expect(worked(employee({ startDate: '2026-01-20', endDate: '2026-02-10' })).employer.contributions.total).toBe(
      4_900,
    )
    // 5 Mar to 25 Mar touches only March.
    expect(worked(employee({ startDate: '2026-03-05', endDate: '2026-03-25' })).employer.contributions.total).toBe(
      2_450,
    )
  })

  it('reports an end date before the start date', () => {
    expect(problem(employee({ startDate: '2026-05-01', endDate: '2026-02-01' })).message).toBe(
      'Employer #1: the end date is before the start date.',
    )
  })
})

describe('13th month choices', () => {
  it('counts none when it is marked unpaid, though it is still owed', () => {
    const { employer, result } = worked(employee({ thirteenthMode: 'unpaid' }))
    expect(employer.thirteenthOwed).toBe(30_000)
    expect(employer.thirteenthCounted).toBe(0)
    expect(result.compensation?.benefitsPool).toBe(0)
  })

  it('counts the amount typed, whatever is owed', () => {
    const { employer } = worked(employee({ thirteenthMode: 'custom', thirteenthCustom: '20000' }))
    expect(employer.thirteenthOwed).toBe(30_000)
    expect(employer.thirteenthCounted).toBe(20_000)
  })
})

describe('payslip year-to-date mode, counted to a date', () => {
  const ytd = employee(
    {
      mode: 'ytd',
      ytdTaxableGross: '150000',
      ytdSss: '5000',
      ytdPhilhealth: '2500',
      ytdPagibig: '1200',
      taxWithheld: '9000',
    },
    { asOf: '2026-06-30' },
  )

  it('scales six months to the year: pay, contributions and tax withheld all double', () => {
    const { employer, result } = worked(ytd)
    expect(employer.monthsToDate).toBe(6)
    expect(employer.monthsCounted).toBe(12)
    // the payslip gross is after contributions, so they are added back: 150,000 + 8,700 = 158,700
    expect(employer.totalPay).toBe(317_400)
    expect(employer.contributions).toEqual({
      sss: 10_000,
      philhealth: 5_000,
      pagibig: 2_400,
      total: 17_400,
      estimated: false,
    })
    expect(employer.taxWithheld).toBe(18_000)
    // 317,400 - 17,400 = 300,000 taxable; 15% of the 50,000 over 250,000
    expect(result.totalTaxDue).toBe(7_500)
  })

  it('counts only what has happened when the scenario is "so far"', () => {
    const { employer } = worked(ytd, soFarScenario('2026-06-30'))
    expect(employer.monthsCounted).toBe(6)
    expect(employer.totalPay).toBe(158_700)
  })

  it('says there is nothing to add up when the job starts after the as-of date', () => {
    const form = employee({ mode: 'ytd', startDate: '2026-09-01', ytdTaxableGross: '50000' }, { asOf: '2026-06-30' })
    expect(problem(form).message).toContain('no months of work fall in this tax year up to the as-of date')
  })
})

describe('as-of date after the year', () => {
  it('counts the whole year when the date is later than the year, as for a past year viewed today', () => {
    const form = employee({}, { year: 2025, asOf: '2026-11-24' })
    const { employer } = worked(form, soFarScenario('2026-11-24'))
    expect(employer.monthsToDate).toBe(12)
    expect(employer.monthsCounted).toBe(12)
  })
})

describe('several employers', () => {
  it('adds them up: pay, contributions and the 13th month pool', () => {
    const base = initialForm('2026-12-31')
    const form = {
      ...base,
      year: 2026,
      asOf: '2026-12-31',
      employers: [
        { ...newEmployer(1, 2), basic: '30000' },
        { ...newEmployer(3, 4), basic: '20000' },
      ],
    }
    const outcome = worked(form)
    expect(outcome.details.map((d) => d.name)).toEqual(['Employer #1', 'Employer #2'])
    expect(outcome.details.map((d) => d.contributions.total)).toEqual([29_400, 20_400])
    expect(outcome.result.compensation?.totalRegularPay).toBe(600_000)
    expect(outcome.result.compensation?.benefitsPool).toBe(50_000)
    // 600,000 - 49,800 = 550,200 taxable: 22,500 plus 20% of the 150,200 over 400,000
    expect(outcome.result.totalTaxDue).toBe(52_540)
  })
})

describe('nothing to show yet', () => {
  it('asks an employee for a salary', () => {
    const outcome = problem(employee({ basic: '' }))
    expect(outcome).toMatchObject({ empty: true })
    expect(outcome.message).toContain('basic salary')
  })

  it('asks someone with both kinds of income for either', () => {
    const outcome = problem(withTaxpayer(employee({ basic: '' }), { type: 'mixed', method: 'graduated' }))
    expect(outcome).toMatchObject({ empty: true })
    expect(outcome.message).toContain('basic salary')
    expect(outcome.message).toContain('business')
  })

  it('counts other income alone as something to work out', () => {
    const base = withTaxpayer(employee({ basic: '' }), { type: 'self-employed', method: 'graduated' })
    const form = { ...base, business: { ...base.business, otherIncome: '400000' } }
    // 400,000 taxable: 15% of the 150,000 over 250,000
    expect(worked(form).result.totalTaxDue).toBe(22_500)
  })

  it('asks a self-employed person for business income', () => {
    const outcome = problem(withTaxpayer(employee({ basic: '' }), { type: 'self-employed', method: 'graduated' }))
    expect(outcome).toMatchObject({ empty: true })
    expect(outcome.message).toContain('business or freelance')
  })
})

describe('mistakes in what was typed', () => {
  it('names the employer and the field for a number that is not valid', () => {
    expect(problem(employee({ basic: '12x' })).message).toBe(
      'Employer #1: "12x" is not a valid amount for basic salary.',
    )
  })

  it('names the box when a date is not a real date, and does not mistake it for a date out of order', () => {
    expect(problem(employee({ startDate: '2026-02-30' })).message).toBe(
      'Employer #1: the start date is not a real date (use YYYY-MM-DD).',
    )
    expect(problem(employee({ startDate: '2026-05-01', endDate: '2026-3-5' })).message).toBe(
      'Employer #1: the end date is not a real date (use YYYY-MM-DD).',
    )
    const base = withTaxpayer(employee(), { type: 'self-employed', method: 'graduated' })
    const form = { ...base, business: { ...base.business, amount: '100000', startDate: 'soon' } }
    expect(problem(form).message).toBe('Business: the start date is not a real date (use YYYY-MM-DD).')
  })

  it('reports a business end date before its start date', () => {
    const base = withTaxpayer(employee(), { type: 'self-employed', method: 'graduated' })
    const form = {
      ...base,
      business: { ...base.business, amount: '100000', startDate: '2026-05-01', endDate: '2026-02-01' },
    }
    expect(problem(form).message).toBe('Business: the end date is before the start date.')
  })

  it('does not accept a negative amount', () => {
    expect(problem(employee({ basic: '-5' })).message).toBe('Employer #1: basic salary cannot be negative.')
  })

  it('gives a plain message for a failure the person did not cause, not the engine wording', () => {
    expect(problem(employee({}, { asOf: 'abc' })).message).toBe(
      'Those figures could not be worked out. Check the amounts and the tax year.',
    )
  })

  it('names a tax year that has no rules', () => {
    expect(problem({ ...employee(), year: 1990 }).message).toBe('No tax rules for tax year 1990')
  })

  it('points the 8% option over its limit to graduated rates, with both figures', () => {
    const base = withTaxpayer(employee(), { type: 'self-employed', method: 'eight-percent' })
    const form = { ...base, business: { ...base.business, amount: '300000', frequency: 'month' as const } }
    const message = problem(form).message
    expect(message).toContain('only covers up to ₱3,000,000.00')
    expect(message).toContain('₱3,600,000.00')
    expect(message).toContain('Choose Graduated rates instead.')
  })
})

describe('notes', () => {
  it('says a note once when more than one employer gives it', () => {
    const base = { ...employee(), year: 2020 }
    const form = { ...base, employers: [base.employers[0], { ...base.employers[0], id: 9 }] }
    const outcome = run(form)
    if (!outcome.ok) throw new Error(outcome.message)
    const note = 'For 2020 contributions are not estimated automatically'
    expect(outcome.notes.filter((n) => n.startsWith(note))).toHaveLength(1)
  })

  const graduated = (business: Partial<FormState['business']>) => {
    const base = withTaxpayer(employee(), { type: 'self-employed', method: 'graduated' })
    return worked({
      ...base,
      business: { ...base.business, amount: '100000', frequency: 'month', ...business },
    }).notes.join(' ')
  }

  it('explains the 40% deduction on graduated rates, and that percentage tax is not included', () => {
    const notes = graduated({})
    expect(notes).toContain('The 40% standard deduction replaces all business expenses')
    expect(notes).toContain('Percentage tax (3%) or VAT')
  })

  it('explains itemizing, and warns about a loss', () => {
    const base = initialForm('2026-12-31')
    const notes = graduated({
      deduction: 'itemized',
      expenses: [{ ...base.business.expenses[0], amount: '150000', per: 'month' }],
    })
    expect(notes).toContain('Itemized: only the expenses you list are deducted')
    expect(notes).toContain('the business shows a loss')
  })

  it('says de minimis benefits are treated as tax-free', () => {
    const base = employee()
    const form = {
      ...base,
      employers: [
        {
          ...base.employers[0],
          hasDeMinimis: true,
          deMinimis: [{ id: 9, label: 'Rice', amount: '1000', per: 'month' as const }],
        },
      ],
    }
    expect(worked(form).notes.join(' ')).toContain('De minimis benefits are treated as tax-free')
  })

  it('has no notes for a plain employee', () => {
    expect(worked(employee()).notes).toEqual([])
  })
})
