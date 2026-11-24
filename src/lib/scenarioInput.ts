import { parseIsoDate } from '../engine/dates.ts'
import { extrapolate } from '../engine/projection.ts'
import { parsePeso } from './peso.ts'

/** Something wrong with what was typed. The message is written for the person and shown as it is. */
export class InputProblem extends Error {}

/** A typed amount as a number. `where` and `field` say which box it came from when it cannot be used. */
export function amount(where: string, field: string, text: string): number {
  const value = parsePeso(text)
  if (Number.isNaN(value)) throw new InputProblem(`${where}: "${text}" is not a valid amount for ${field}.`)
  if (value < 0) throw new InputProblem(`${where}: ${field} cannot be negative.`)
  return value
}

/** Scales a to-date figure to the counted months. Zero stays zero, even when no months have passed yet. */
export function scale(where: string, value: number, monthsToDate: number, monthsCounted: number): number {
  if (value === 0) return 0
  if (monthsToDate === 0) {
    throw new InputProblem(
      `${where}: no months of work fall in this tax year up to the as-of date, so there is nothing to add up yet. Check the dates.`,
    )
  }
  return extrapolate(value, monthsToDate, monthsCounted)
}

/** A typed date: blank is fine, anything else must be a real date. Check before comparing dates as text. */
export function checkDate(where: string, label: string, text: string): void {
  if (text === '') return
  try {
    parseIsoDate(text)
  } catch {
    throw new InputProblem(`${where}: the ${label} is not a real date (use YYYY-MM-DD).`)
  }
}

/** The earlier of two ISO dates. */
export const minIso = (a: string, b: string): string => (a <= b ? a : b)
