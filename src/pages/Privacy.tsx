import { Link } from 'react-router'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage.tsx'
import ExternalLink from '@/components/shared/ExternalLink.tsx'
import { ANALYTICS_ENABLED, CONTACT, HOSTING_PROVIDER, OWNER_NAME, OWNER_SITE, SITE_NAME } from '@/config.ts'

/** Change this whenever the wording of the privacy policy changes. */
const LAST_UPDATED = '27 November 2026'

function WithoutAnalytics() {
  return (
    <p>
      This site does not set cookies and does not use analytics. The only thing it keeps in your browser, in local
      storage, is your choice of light or dark mode, once you use the button for it. If that changes, I will update this
      page first and ask for your consent before any analytics runs.
    </p>
  )
}

function WithAnalytics() {
  return (
    <>
      <p>
        The site itself sets no cookies. In your browser&rsquo;s local storage it can keep two things: your answer to
        the analytics question, so that you are not asked on every visit, and your choice of light or dark mode, once
        you use the button for it.
      </p>
      <p>
        If you accept, the site loads Google&rsquo;s tag (Google Tag Manager), which sends information to Google
        Analytics so that I can see how the site is used. Google Analytics&rsquo; standard user engagement measurements
        are all switched on:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>your first visit, each new visit, and how long you spend on the site</li>
        <li>the pages you view, with their titles and addresses, and the site you came from</li>
        <li>when you scroll near the bottom of a page</li>
        <li>links you click to other sites, with each link&rsquo;s address</li>
        <li>
          files you open from a link, such as the PDF sources, with the file&rsquo;s name and the link&rsquo;s text
        </li>
        <li>
          searches, video plays and the use of forms. The site has no search box, videos or forms, so there is nothing
          of these for it to record.
        </li>
      </ul>
      <p>
        With these, Google Analytics receives your device and browser type, screen size, language and approximate
        location, worked out from your IP address. It sets cookies, which it uses to tell whether you have visited
        before. The site does not send it anything you type into the calculators. I use it only to understand how the
        site is used, not for advertising. Google handles this information under the{' '}
        <ExternalLink href="https://policies.google.com/privacy">Google Privacy Policy</ExternalLink>, and may process
        it outside the Philippines.
      </p>
      <p>
        If you decline, nothing from Google loads. You can change your answer at any time with &ldquo;Analytics
        choice&rdquo; at the bottom of any page. If you decline after accepting, the site tells Google&rsquo;s tag to
        stop using cookies. The tag may still send limited information without cookies until you reload the page. After
        that, it does not load. Cookies already set stay until you clear them in your browser.
      </p>
    </>
  )
}

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        I'm {OWNER_NAME} (<ExternalLink href={OWNER_SITE.href}>{OWNER_SITE.label}</ExternalLink>), and I built and run{' '}
        {SITE_NAME}. This page explains what happens to the information you enter, and what the site does and does not
        collect.
      </p>

      <div className="rounded-lg bg-muted/60 p-3 text-sm">
        <p className="mb-1 font-semibold">In short</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>What you type stays in your browser. It is never sent to me or to anyone else.</li>
          <li>There are no accounts, and I do not ask for your name, email address or TIN.</li>
          <li>
            {ANALYTICS_ENABLED
              ? 'Google Analytics loads only if you accept it. Until then, nothing from Google loads and no cookies are set.'
              : 'The site sets no cookies and has no analytics.'}
          </li>
        </ul>
      </div>

      <LegalSection title="1. What you type stays in your browser">
        <p>
          Everything you enter, including amounts, dates and any names you give benefits or expenses, is used to
          calculate your estimate on your own device. None of it is sent to any server or saved (not even in your
          browser), and there are no accounts. If you refresh or close the page, it is gone. The same goes for anything
          you type into the built-in calculator.
        </p>
        <p>
          Please do not type things the calculator does not ask for, such as your TIN, your name or your employer's
          details. It does not need them.
        </p>
      </LegalSection>

      <LegalSection title="2. What I do not collect">
        <p>
          I do not ask for or keep your name, email address, TIN, address or any document. I do not run advertising, and
          I do not sell your personal data. I do not give it to anyone except the providers described below.
        </p>
      </LegalSection>

      <LegalSection title="3. Hosting and technical logs">
        <p>
          The site is hosted by {HOSTING_PROVIDER}. Like most web hosts, it may process standard technical information
          whenever your browser loads a page, such as your IP address, browser type, the page requested and the time. It
          may do this in countries outside the Philippines, under its own privacy policy. I do not use this information
          to identify you. The fonts, images and code come from the site itself, so loading a page does not make your
          browser contact any other company{ANALYTICS_ENABLED && ', unless you accept analytics (see section 4)'}.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies and analytics">
        {ANALYTICS_ENABLED ? <WithAnalytics /> : <WithoutAnalytics />}
      </LegalSection>

      <LegalSection title="5. Links to other sites">
        <p>
          The{' '}
          <Link to="/about" className="underline">
            About &amp; sources
          </Link>{' '}
          page links to where the tax rules come from, such as the BIR, SSS, PhilHealth, the DBM and Lawphil. Those
          sites have their own privacy practices, which I do not control.
        </p>
      </LegalSection>

      <LegalSection title="6. Changes to this policy">
        <p>
          I will update this page and its date when something changes, and I will update it first, before the site
          starts collecting anything new.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights and contact">
        <p>
          The Data Privacy Act of 2012 (Republic Act 10173) and its implementing rules give you rights over your
          personal data, such as the right to be informed, to access and correct it, to object, to ask for it to be
          deleted or blocked, and to withdraw your consent. Because this site keeps none of your figures, I have none of
          them to hand back or delete.
          {ANALYTICS_ENABLED &&
            ' You can withdraw your consent to analytics with “Analytics choice” at the bottom of any page.'}{' '}
          You can still ask me anything about how the site works, and I will answer. Message me on{' '}
          <ExternalLink href={CONTACT.href}>{CONTACT.label}</ExternalLink>. If you think your data has been mishandled,
          you can also complain to the{' '}
          <ExternalLink href="https://privacy.gov.ph">National Privacy Commission</ExternalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
