import { useEffect, useState } from 'react'
import { ANALYTICS_ENABLED, GOOGLE_TAG_ID } from '@/config.ts'
import {
  allowAnalytics,
  CONSENT_STORAGE_KEY,
  readChoice,
  saveChoice,
  stopAnalytics,
  type ConsentChoice,
} from '@/lib/consent.ts'

/** Whether to ask about analytics, and what to do with the answer. */
export function useConsent() {
  const [choice, setChoice] = useState(() => (ANALYTICS_ENABLED ? readChoice() : null))
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    if (ANALYTICS_ENABLED && choice === 'granted') allowAnalytics(GOOGLE_TAG_ID)
  }, [choice])

  // The answer can change while this tab is open: in another tab, or while this page waited in the back/forward cache.
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return
    const follow = () => {
      const next = readChoice()
      if (next !== 'granted') stopAnalytics()
      setChoice(next)
      setReopened(false)
    }
    const onStorage = (event: StorageEvent) => {
      // A null key means all of the site's storage was cleared.
      if (event.key === null || event.key === CONSENT_STORAGE_KEY) follow()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) follow()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const decide = (next: ConsentChoice) => {
    saveChoice(next)
    if (next === 'denied') stopAnalytics()
    setChoice(next)
    setReopened(false)
  }

  return {
    asking: ANALYTICS_ENABLED && (choice === null || reopened),
    reopened,
    decide,
    reopen: () => setReopened(true),
  }
}
