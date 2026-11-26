import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * The logo's calculator in a 24 x 24 box. The `.ci-*` rules in index.css fill its parts; add `icon-on-dark` on a dark
 * surface.
 */
export default function CalculatorIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
      className={cn('brand-icon', className)}
    >
      {/* The body is the logo's white tile, then the display, six keys and the tall key. */}
      <rect x="3" y="3" width="18" height="18" rx="2.6" />
      <rect className="ci-display" x="4.875" y="4.875" width="14.25" height="3.5625" rx="1.125" />
      <g className="ci-keys">
        <rect x="4.875" y="9.9375" width="3.75" height="2.4375" rx="0.94" />
        <rect x="9.75" y="9.9375" width="3.75" height="2.4375" rx="0.94" />
        <rect x="4.875" y="13.3125" width="3.75" height="2.4375" rx="0.94" />
        <rect x="9.75" y="13.3125" width="3.75" height="2.4375" rx="0.94" />
        <rect x="4.875" y="16.6875" width="3.75" height="2.4375" rx="0.94" />
        <rect x="9.75" y="16.6875" width="3.75" height="2.4375" rx="0.94" />
      </g>
      <rect className="ci-tall" x="14.625" y="9.9375" width="4.5" height="9.1875" rx="0.94" />
    </svg>
  )
}
