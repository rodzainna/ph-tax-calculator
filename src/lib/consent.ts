/** The visitor's answer about analytics. Nothing from Google loads unless it is 'granted'. */
export type ConsentChoice = 'granted' | 'denied'

export const CONSENT_STORAGE_KEY = 'ph-tax-analytics-consent'
export const TAG_SCRIPT_ID = 'google-tag'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export const parseChoice = (raw: string | null): ConsentChoice | null =>
  raw === 'granted' || raw === 'denied' ? raw : null

export function readChoice(): ConsentChoice | null {
  try {
    return parseChoice(localStorage.getItem(CONSENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveChoice(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Storage is blocked, so the answer lasts only until the page closes.
  }
}

export const tagScriptUrl = (id: string): string =>
  `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`

const tagIsLoaded = (): boolean => document.getElementById(TAG_SCRIPT_ID) !== null

function gtag(..._command: unknown[]): void {
  window.dataLayer = window.dataLayer ?? []
  // Google's tag reads the `arguments` object. It ignores an array of the same values.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

/** What is counted: that a calculator gave an estimate. */
export type UsageEvent = 'monthly_estimate' | 'annual_estimate'

// The calculators that gave an estimate since the page loaded, and those already reported. Only the names are kept.
const used = new Set<UsageEvent>()
const reported = new Set<UsageEvent>()
let permitted = false

function reportUse(): void {
  if (!permitted) return
  for (const event of used) {
    if (reported.has(event)) continue
    reported.add(event)
    // Only the name is sent. Do not add figures or anything else the visitor typed.
    gtag('event', event)
  }
}

/** Reported once per page load, and only while analytics is allowed. If it is allowed later, it is reported then. */
export function countUse(event: UsageEvent): void {
  used.add(event)
  reportUse()
}

/** Starts again, as a newly loaded page would. For tests. */
export function forgetUse(): void {
  used.clear()
  reported.clear()
  permitted = false
}

/** The site shows no ads, so the advertising permissions are never granted. */
const ADS_DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

/** Call only after the visitor accepts. Loads the tag, or switches analytics back on if it is already loaded. */
export function allowAnalytics(id: string): void {
  if (tagIsLoaded()) gtag('consent', 'update', { analytics_storage: 'granted' })
  else loadTag(id)
  permitted = true
  reportUse()
}

function loadTag(id: string): void {
  gtag('consent', 'default', { ...ADS_DENIED, analytics_storage: 'granted' })
  // Without this, the cookies cover the whole parent domain and are sent to its other sites too.
  gtag('set', { cookie_domain: 'none' })
  gtag('js', new Date())
  const script = document.createElement('script')
  script.id = TAG_SCRIPT_ID
  script.async = true
  script.src = tagScriptUrl(id)
  document.head.appendChild(script)
}

/** For a visitor who declines after accepting. The tag stays on the page until it is reloaded. */
export function stopAnalytics(): void {
  permitted = false
  if (tagIsLoaded()) gtag('consent', 'update', { analytics_storage: 'denied' })
}
