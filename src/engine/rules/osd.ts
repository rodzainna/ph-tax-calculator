/** Optional standard deduction: NIRC Sec. 34(L) as amended by RA 10963, 40% of gross receipts instead of itemizing; checked against the eBIRForms 1701v2018 code. */
export interface OsdRule {
  fromYear: number
  toYear: number | null
  /** Share of gross sales/receipts deducted. */
  rate: number
  source: string
  verified: boolean
}

export const OSD_RULES: OsdRule[] = [
  {
    fromYear: 2018,
    toYear: null,
    rate: 0.4,
    source:
      'RA 10963 Sec. 34(L) NIRC: optional standard deduction, 40% of gross sales or gross receipts; eBIRForms 1701v2018: 40% of Item 10, rounded to a whole peso',
    verified: true,
  },
]
