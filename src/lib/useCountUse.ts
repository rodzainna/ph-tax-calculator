import { useEffect } from 'react'
import { countUse, type UsageEvent } from '@/lib/consent.ts'

/** Counts that a calculator gave an estimate. No figures are passed on. */
export function useCountUse(event: UsageEvent, hasEstimate: boolean): void {
  useEffect(() => {
    if (hasEstimate) countUse(event)
  }, [event, hasEstimate])
}
