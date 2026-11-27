export type SourceStatus = 'Verified' | 'Partly' | 'Not verified'

export interface SourceLink {
  label: string
  href: string
}

export interface Source {
  topic: string
  years: string
  status: SourceStatus
  /** What is assumed, unread or simplified. */
  note?: string
  links: SourceLink[]
}

/** The oldest date any row was last checked. */
export const RULES_LAST_CHECKED = '20 November 2026'

const TRAIN: SourceLink = {
  label: 'RA 10963 (TRAIN)',
  href: 'https://www.lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html',
}
const RR_11_2018: SourceLink = {
  label: 'RR 11-2018 digest',
  href: 'https://bir-cdn.bir.gov.ph/local/pdf/Digest%20RR%2011-2018.pdf',
}
const SSS_ACT: SourceLink = {
  label: 'RA 11199',
  href: 'https://lawphil.net/statutes/repacts/ra2019/ra_11199_2019.html',
}
const UHC_RULES: SourceLink = {
  label: 'Universal Health Care Act rules',
  href: 'https://www.philhealth.gov.ph/about_us/UHC-IRR_Signed.pdf',
}
const PHILHEALTH_2025: SourceLink = {
  label: 'PhilHealth Advisory 2025-0002',
  href: 'https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf',
}

/** Where each rule on the site comes from. Keep it in step with `engine/rules`. */
export const SOURCES: Source[] = [
  { topic: 'Income tax rates', years: '2018 onward', status: 'Verified', links: [TRAIN] },
  {
    topic: '8% option and mixed income',
    years: '2018 onward',
    status: 'Verified',
    note: 'No ₱250,000 reduction if you also earn a salary.',
    links: [TRAIN],
  },
  {
    topic: 'Business income: 40% standard deduction and itemized expenses',
    years: '2018 onward',
    status: 'Verified',
    note: 'The 40% deduction and how it is worked out match the BIR offline eBIRForms 1701. Itemized expenses are whatever you enter.',
    links: [TRAIN],
  },
  {
    topic: '₱90,000 benefits exclusion',
    years: '2018 onward',
    status: 'Verified',
    note: 'Applied once across all employers: the law says one total, but this is not confirmed with the BIR.',
    links: [TRAIN, RR_11_2018],
  },
  {
    topic: 'De minimis benefits',
    years: 'All years',
    status: 'Partly',
    note: 'Treated as fully tax-free. The app does not check them against the legal limits, so your tax could be higher than shown.',
    links: [
      {
        label: 'RR 29-2025 digest',
        href: 'https://bir-cdn.bir.gov.ph/BIR/pdf/RR%20No.%2029-2025%20digest%20FINAL.pdf',
      },
    ],
  },
  {
    topic: '13th month pay',
    years: 'All years',
    status: 'Partly',
    note: 'One twelfth of the basic salary earned, as the decree’s rules define it. Later changes to the decree were not checked.',
    links: [{ label: 'PD 851', href: 'https://www.lawphil.net/statutes/presdecs/pd1975/pd_851_1975.html' }],
  },
  {
    topic: 'SSS (employees)',
    years: '2021 onward',
    status: 'Partly',
    note: '2026 uses the 2025 figures: no official 2026 schedule was found.',
    links: [
      SSS_ACT,
      { label: 'SSS Circular 2020-033-b', href: 'https://www.sss.gov.ph/wp-content/uploads/2022/04/ci2020-033-b.pdf' },
      { label: 'SSS Circular 2022-033', href: 'https://www.sss.gov.ph/wp-content/uploads/2023/02/CI2022-033.pdf' },
      {
        label: 'SSS Circular 2024-006',
        href: 'https://www.sss.gov.ph/wp-content/uploads/2024/12/CI-2024-006-Publication.pdf',
      },
    ],
  },
  {
    topic: 'PhilHealth (employees)',
    years: '2021 onward',
    status: 'Verified',
    note: 'For 2023 the rate stayed at 4%, because the planned increase was suspended.',
    links: [
      {
        label: 'PhilHealth contribution table',
        href: 'https://www.philhealth.gov.ph/partners/employers/ContributionTable_v2.pdf',
      },
      {
        label: 'PhilHealth statement, January 2023',
        href: 'https://www.philhealth.gov.ph/ofclstmnts/2023/os2023-01-04.pdf',
      },
      UHC_RULES,
      PHILHEALTH_2025,
      {
        label: 'PhilHealth Advisory 2026-0042',
        href: 'https://www.philhealth.gov.ph/advisories/2026/PA2026-0042.pdf',
      },
    ],
  },
  {
    topic: 'Pag-IBIG (employees)',
    years: '2021 onward',
    status: 'Partly',
    note: 'At most ₱200 a month since February 2024. Pag-IBIG Circular 460 itself was not read: the figures come from a DBM circular letter that sets it out. Later years assume no change.',
    links: [
      { label: 'RA 9679', href: 'https://lawphil.net/statutes/repacts/ra2009/ra_9679_2009.html' },
      {
        label: 'DBM Circular Letter 2024-2',
        href: 'https://www.dbm.gov.ph/wp-content/uploads/Issuances/2024/Circular-Letter/CIRCULAR-LETTER-NO-2024-2-DATED-FEBRUARY-01-2024.pdf',
      },
    ],
  },
  {
    topic: 'Self-employed SSS and PhilHealth (Monthly page)',
    years: '2021 onward',
    status: 'Not verified',
    note: 'Worked out as the whole contribution, with no employer share. This comes from SSS and PhilHealth pages and guides; their circulars for self-employed members were not read. RA 11199 (Sec. 9-A) makes SSS compulsory for many of the self-employed, and the Universal Health Care Act rules require premiums from self-earning people. Pag-IBIG for the self-employed is not estimated.',
    links: [SSS_ACT, UHC_RULES, PHILHEALTH_2025],
  },
  {
    topic: 'Minimum wage earner exemption (Monthly page)',
    years: '2008 onward',
    status: 'Not verified',
    note: 'Treats all the pay you enter as exempt from income tax. The exemption covers the minimum wage and its holiday, overtime, night shift differential and hazard pay. The RR 11-2018 digest says other income, such as commissions, is taxable.',
    links: [{ label: 'RA 9504', href: 'https://lawphil.net/statutes/repacts/ra2008/ra_9504_2008.html' }, RR_11_2018],
  },
]
