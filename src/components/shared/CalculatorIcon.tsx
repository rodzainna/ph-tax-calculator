import { cn } from '@/lib/utils'

interface Props {
  className?: string
  /** On a surface that is dark in both themes, or one that turns dark when pressed. */
  onDark?: boolean
}

const image = (file: string, className: string) => <img src={file} alt="" className={className} />

/** The logo's calculator, from public/. It switches to the light version on a dark surface and in dark mode. */
export default function CalculatorIcon({ className, onDark = false }: Props) {
  if (onDark) return image('/calculator-icon-on-dark.svg', cn(className))
  return (
    <>
      {image('/calculator-icon.svg', cn('dark:hidden', className))}
      {image('/calculator-icon-on-dark.svg', cn('hidden dark:block', className))}
    </>
  )
}
