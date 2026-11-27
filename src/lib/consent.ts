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

/** The site shows no ads, so the advertising permissions are never granted. */
const ADS_DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

/** Call only after the visitor accepts. Loads the tag, or switches analytics back on if it is already loaded. */
export function allowAnalytics(id: string): void {
  if (tagIsLoaded()) {
    gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  gtag('consent', 'default', { ...ADS_DENIED, analytics_storage: 'granted' })
  gtag('js', new Date())
  const script = document.createElement('script')
  script.id = TAG_SCRIPT_ID
  script.async = true
  script.src = tagScriptUrl(id)
  document.head.appendChild(script)
}

/** For a visitor who declines after accepting. The tag stays on the page until it is reloaded. */
export function stopAnalytics(): void {
  if (tagIsLoaded()) gtag('consent', 'update', { analytics_storage: 'denied' })
}
