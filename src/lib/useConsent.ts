import { useEffect, useState } from 'react'
import { ANALYTICS_ENABLED, GOOGLE_TAG_ID } from '@/config.ts'
import { allowAnalytics, readChoice, saveChoice, stopAnalytics, type ConsentChoice } from '@/lib/consent.ts'

/** Whether to ask about analytics, and what to do with the answer. */
export function useConsent() {
  const [choice, setChoice] = useState(() => (ANALYTICS_ENABLED ? readChoice() : null))
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    if (ANALYTICS_ENABLED && choice === 'granted') allowAnalytics(GOOGLE_TAG_ID)
  }, [choice])

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
