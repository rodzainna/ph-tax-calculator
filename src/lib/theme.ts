/** Light or dark: follows the device until the header button saves a choice; only "light" or "dark" is stored. */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ph-tax-theme'

export const parseTheme = (raw: string | null): Theme | null => (raw === 'light' || raw === 'dark' ? raw : null)

/** The saved choice if there is one, otherwise what the device prefers. */
export const resolveTheme = (saved: Theme | null, prefersDark: boolean): Theme => saved ?? (prefersDark ? 'dark' : 'light')

export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')

export function readSavedTheme(): Theme | null {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode or blocked storage: the choice just lasts until the page closes.
  }
}

/** Puts the theme on the page: the `dark` class switches the colours, `color-scheme` the browser's own controls. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
