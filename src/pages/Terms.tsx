import { Link } from 'react-router'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage.tsx'
import ExternalLink from '@/components/shared/ExternalLink.tsx'
import { CONTACT, OWNER_NAME, SITE_NAME } from '@/config.ts'
import { CONTRIBUTIONS_FIRST_YEAR } from '@/engine/rules/contributions.ts'
import { ANNUAL_FIRST_YEAR } from '@/lib/taxYears.ts'

/** Change this whenever the wording of these terms changes. */
const LAST_UPDATED = '27 November 2026'

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" lastUpdated={LAST_UPDATED}>
      <p>
        By using {SITE_NAME} you agree to these terms. If you do not agree, please do not use the site. How your
        information is handled is in the{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <LegalSection title="1. What this site is">
        <p>
          A free tool that estimates Philippine individual income tax and take-home pay from the figures you enter, for
          employees, self-employed people and people with both. I'm {OWNER_NAME}, and I built and run it.
        </p>
      </LegalSection>

      <LegalSection title="2. Estimates only, not tax advice">
        <p>
          Results are estimates for planning. They are not tax, legal or accounting advice, and they are not a filed or
          filing-ready return. Your actual tax depends on your own documents and circumstances, on how your employers
          and clients reported and withheld, and on how the Bureau of Internal Revenue (BIR) applies the rules to you.
          The estimates do not cover every situation. For example, they leave out percentage tax or VAT on your sales,
          so you could owe more than shown. They do not check de minimis benefits against the legal limits, so your tax
          could be higher than shown. They also do not deduct business losses carried forward from earlier years, so if
          you are entitled to deduct one, your tax could be lower than shown. Before you file or pay, check the figures
          with the BIR, your Revenue District Office, or a certified public accountant.
        </p>
      </LegalSection>

      <LegalSection title="3. Supported years and rules">
        <p>
          For tax years {CONTRIBUTIONS_FIRST_YEAR} onward, the calculator can estimate an employee's SSS, PhilHealth and
          Pag-IBIG contributions from a salary. For the self-employed, only the Monthly page estimates SSS and
          PhilHealth, when you switch them on, and you type Pag-IBIG yourself. For {ANNUAL_FIRST_YEAR} to{' '}
          {CONTRIBUTIONS_FIRST_YEAR - 1}, you enter your own contributions on the Annual page. Earlier years are not
          supported. The rules come from public sources, and the{' '}
          <Link to="/about" className="underline">
            About &amp; sources
          </Link>{' '}
          page shows how far each one is confirmed (verified, partly verified or not verified) and what is assumed. Tax
          rules, rates and ceilings change, and the site may be out of date or contain mistakes.
        </p>
      </LegalSection>

      <LegalSection title="4. Your responsibility">
        <p>
          You are responsible for the accuracy of what you enter, for checking the result, and for filing and paying
          correctly and on time. Enter figures from your own documents (such as your BIR Form 2316 and payslips).
        </p>
      </LegalSection>

      <LegalSection title="5. Using the site fairly">
        <p>
          Please use the site normally. Do not try to break it, overload it, or copy it in bulk in a way that gets in
          the way of other people using it.
        </p>
      </LegalSection>

      <LegalSection title="6. No affiliation">
        <p>
          This site is independent. It is not affiliated with or endorsed by the BIR, SSS, PhilHealth, Pag-IBIG or any
          government agency. Their names are used only to refer to their rules.
        </p>
      </LegalSection>

      <LegalSection title="7. No warranty">
        <p>
          The site and its results are provided "as is" and "as available", without any warranty of accuracy,
          completeness or fitness for a particular purpose.
        </p>
      </LegalSection>

      <LegalSection title="8. Limit of liability">
        <p>
          To the extent the law allows, I am not liable for any loss, penalty, interest, surcharge or other damage
          arising from your use of, or reliance on, the site or its results. This does not limit any right you have
          under Philippine law that cannot be waived.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          I may change the site or these terms, or take the site down, at any time. The date at the top shows when the
          terms last changed.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law">
        <p>These terms are governed by the laws of the Republic of the Philippines.</p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions about these terms? Message me on <ExternalLink href={CONTACT.href}>{CONTACT.label}</ExternalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
