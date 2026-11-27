/** Who runs the site, how to reach them, who serves it and whether it has analytics. */
export const SITE_NAME = 'PH Tax Calculator'
export const OWNER_NAME = 'Rodzainna Hamisain'
export const OWNER_SITE = { label: 'rodzainna.com', href: 'https://rodzainna.com' }
/** A profile link, so that no email address is published. */
export const CONTACT = { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rodzainna' }
export const HOSTING_PROVIDER = 'Vercel'
export const HOSTING_PRIVACY_URL = 'https://vercel.com/legal/privacy-notice'

/** The Google tag that loads after a visitor accepts. When it is empty, the site has no analytics. */
export const GOOGLE_TAG_ID: string = import.meta.env.VITE_GTM_ID ?? ''
export const ANALYTICS_ENABLED = GOOGLE_TAG_ID !== ''
