export type TaxpayerType = 'employee' | 'self-employed' | 'mixed'
/** For the self-employed and mixed income earners: the regular graduated rates, or the flat 8% option. */
export type TaxMethod = 'graduated' | 'eight-percent'

export interface Taxpayer {
  type: TaxpayerType
  /** Only used when type is 'self-employed' or 'mixed'. */
  method: TaxMethod
}

export const initialTaxpayer = (): Taxpayer => ({ type: 'employee', method: 'graduated' })

export const isSelfEmployed = (taxpayer: Taxpayer): boolean => taxpayer.type === 'self-employed'

/** Pay from employers counts for everyone but the self-employed. */
export const usesEmployers = (taxpayer: Taxpayer): boolean => taxpayer.type !== 'self-employed'

/** Business or freelance income counts for everyone but employees. */
export const usesBusiness = (taxpayer: Taxpayer): boolean => taxpayer.type !== 'employee'
