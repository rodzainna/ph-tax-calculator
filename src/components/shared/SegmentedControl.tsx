import { ToggleGroup } from 'radix-ui'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<SegmentOption<T>>
  /** What the switch chooses, for screen readers. */
  label: string
}

/** A small pill switch to pick one view out of a few. The chosen one takes the brand gradient, like the active page in the header. */
export default function SegmentedControl<T extends string>({ value, onChange, options, label }: Props<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Clicking the chosen one again would clear it; there is always one chosen.
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className="inline-flex items-center rounded-full border border-foreground/10 bg-muted/60 p-1 shadow-[inset_0_1px_2px_rgb(32_46_84/0.07)] dark:shadow-none"
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="relative rounded-full px-3 py-1.5 text-xs after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']  font-medium text-muted-foreground outline-none transition-all duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-gradient-to-br data-[state=on]:from-brand-teal data-[state=on]:to-brand-navy-mid data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:shadow-brand-teal/30"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
