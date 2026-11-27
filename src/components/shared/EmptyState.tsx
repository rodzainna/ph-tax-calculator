import { HandCoins } from 'lucide-react'
import type { CSSProperties } from 'react'

/** What a result card shows before there is anything to calculate; `title` says what will appear. */
export default function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      {/* Two decorative rings around the icon. The outer one has the moving gradient line. */}
      <span
        style={{ '--ring-width': '1.5px' } as CSSProperties}
        className="gradient-ring flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-blush/25 to-brand-teal-bright/20"
        aria-hidden
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-blush/40 to-brand-teal-bright/35">
          {/* The logo's navy-to-teal gradient with a coral glow in the corner. */}
          <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_-4px_rgb(32_46_84/0.55),inset_0_1px_0_rgb(255_255_255/0.2)]">
            <HandCoins className="icon-on-dark size-5" />
          </span>
        </span>
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
    </div>
  )
}
