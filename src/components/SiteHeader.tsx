import { Moon, Sun } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { useTheme } from '@/lib/useTheme.ts'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-1.5 text-center text-sm font-medium max-[359px]:px-1.5 transition-all duration-200 sm:px-4',
    isActive
      ? 'bg-gradient-to-br from-brand-teal to-brand-navy-mid text-white shadow-md shadow-brand-teal/30'
      : 'text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10',
  )

/** The top bar: logo and name on the left, a pill of pages and the light/dark button on the right. */
export default function SiteHeader() {
  const { theme, toggle } = useTheme()
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-blush/25 via-white/70 to-brand-teal-bright/20 dark:from-brand-coral/15 dark:via-background/80 dark:to-brand-teal-bright/15 backdrop-blur-md after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-brand-coral after:via-brand-blush after:to-brand-teal-bright">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:py-3">
        <Link to="/" className="group flex min-w-0 items-center gap-3 whitespace-nowrap">
          <span className="relative size-9 shrink-0">
            <span
              aria-hidden
              className="absolute -inset-1.5 rounded-[22%] bg-gradient-to-br from-brand-coral to-brand-teal-bright opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-80"
            />
            {/* 22% is the favicon's own corner radius (14 of 64), so the dark shape keeps its proportions. */}
            <img
              src="/favicon.svg"
              alt=""
              width={36}
              height={36}
              className="relative size-9 shrink-0 rounded-[22%] shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
            />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2">
              <span className="text-base font-semibold leading-none tracking-tight text-foreground">
                PH Tax{' '}
                <span className="bg-gradient-to-r from-brand-teal to-brand-coral-deep bg-clip-text text-transparent dark:from-brand-teal-light dark:to-brand-coral-light">Calculator</span>
              </span>
              <span className="rounded-full bg-secondary px-2 py-[3px] text-[11px] font-semibold uppercase leading-none tracking-wider text-secondary-foreground">
                Prototype
              </span>
            </span>
            <span className="hidden truncate text-xs leading-tight text-muted-foreground lg:block">Take-home pay and income tax estimates</span>
          </span>
        </Link>

        {/* The pages, then the buttons grouped on the right (8px apart, set off from the pages). */}
        <div className="flex items-center justify-between gap-4 max-[359px]:gap-2 sm:justify-start">
        <nav aria-label="Main">
          <div className="flex shrink-0 items-center rounded-full border border-white/80 bg-white/55 p-1 dark:border-white/10 dark:bg-white/5 shadow-[inset_0_1px_2px_rgb(32_46_84/0.07)] backdrop-blur">
            <NavLink to="/" end className={linkClass}>
              Monthly
            </NavLink>
            <NavLink to="/year" className={linkClass}>
              Annual
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              <span className="sm:hidden">About</span>
              <span className="hidden sm:inline">About &amp; sources</span>
            </NavLink>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[22%] border border-brand-teal-bright/30 bg-white/85 shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15 lg:rounded-[9px]"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
        </div>
      </div>
    </header>
  )
}
