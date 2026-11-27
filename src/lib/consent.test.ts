// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  allowAnalytics,
  CONSENT_STORAGE_KEY,
  countUse,
  forgetUse,
  parseChoice,
  readChoice,
  saveChoice,
  stopAnalytics,
  TAG_SCRIPT_ID,
  tagScriptUrl,
} from './consent.ts'

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  delete window.dataLayer
  forgetUse()
})
afterEach(() => vi.restoreAllMocks())

const tags = () => document.querySelectorAll(`script#${TAG_SCRIPT_ID}`)
// Each command is an `arguments` object, so it is copied to an array to compare it.
const commands = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>))
const consentCommands = () => commands().filter(([name]) => name === 'consent')

describe('the saved answer', () => {
  it('reads only the two known answers', () => {
    expect(parseChoice('granted')).toBe('granted')
    expect(parseChoice('denied')).toBe('denied')
    for (const other of [null, '', 'yes', 'true']) expect(parseChoice(other), String(other)).toBeNull()
  })

  it('is kept in local storage', () => {
    expect(readChoice()).toBeNull()
    saveChoice('denied')
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    expect(readChoice()).toBe('denied')
  })

  it('does not break the page when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readChoice()).toBeNull()
    expect(() => saveChoice('granted')).not.toThrow()
  })
})

describe('the Google tag', () => {
  it('builds the script address from the tag ID', () => {
    expect(tagScriptUrl('GTM-TEST')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST')
    expect(tagScriptUrl('a&b')).toBe('https://www.googletagmanager.com/gtm.js?id=a%26b')
  })

  it('sets the permissions before the tag starts, with advertising denied', () => {
    allowAnalytics('GTM-TEST')
    expect(commands()[0]).toEqual([
      'consent',
      'default',
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' },
    ])
    expect(commands()[1]).toEqual(['set', { cookie_domain: 'none' }])
    expect(commands()[2]![0]).toBe('js')
    expect(tags()).toHaveLength(1)
    expect((tags()[0] as HTMLScriptElement).src).toBe(tagScriptUrl('GTM-TEST'))
  })

  it('gives the tag `arguments` objects, which it needs', () => {
    allowAnalytics('GTM-TEST')
    expect(Object.prototype.toString.call(window.dataLayer![0])).toBe('[object Arguments]')
  })

  it('is added only once', () => {
    allowAnalytics('GTM-TEST')
    allowAnalytics('GTM-TEST')
    expect(tags()).toHaveLength(1)
  })

  it('is switched off, then on again for someone who changes their mind twice', () => {
    allowAnalytics('GTM-TEST')
    stopAnalytics()
    expect(consentCommands().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }])
    allowAnalytics('GTM-TEST')
    expect(consentCommands().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'granted' }])
    expect(tags()).toHaveLength(1)
  })

  it('does nothing when told to stop before it was ever loaded', () => {
    stopAnalytics()
    expect(window.dataLayer).toBeUndefined()
    expect(tags()).toHaveLength(0)
  })
})

describe('counting that a calculator was used', () => {
  const events = () => commands().filter(([name]) => name === 'event')

  it('sends nothing without permission', () => {
    countUse('monthly_estimate')
    expect(window.dataLayer).toBeUndefined()
  })

  it('sends the name and nothing else, once, however often the estimate changes', () => {
    allowAnalytics('GTM-TEST')
    countUse('monthly_estimate')
    countUse('monthly_estimate')
    countUse('annual_estimate')
    expect(events()).toEqual([
      ['event', 'monthly_estimate'],
      ['event', 'annual_estimate'],
    ])
  })

  it('sends an estimate already shown once analytics is accepted, after the tag is set up', () => {
    countUse('monthly_estimate')
    allowAnalytics('GTM-TEST')
    expect(commands().map(([name]) => name)).toEqual(['consent', 'set', 'js', 'event'])
  })

  it('sends nothing new while declined, then sends it if accepted again, without repeating', () => {
    allowAnalytics('GTM-TEST')
    countUse('monthly_estimate')
    stopAnalytics()
    countUse('annual_estimate')
    expect(events()).toHaveLength(1)
    allowAnalytics('GTM-TEST')
    expect(events()).toEqual([
      ['event', 'monthly_estimate'],
      ['event', 'annual_estimate'],
    ])
  })
})
