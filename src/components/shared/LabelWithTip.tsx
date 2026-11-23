import type { ReactNode } from 'react'
import InfoTip from '@/components/shared/InfoTip.tsx'
import { splitLastWord } from '@/lib/text.ts'

interface Props {
  label: ReactNode
  /** Something small right after the label, such as a rate ("5%"). */
  after?: ReactNode
  /** The explanation shown in the ⓘ. Leave out for no ⓘ. */
  hint?: string
  contentClassName?: string
}

/** A label with an optional ⓘ. The ⓘ is tied to the last word, so if the label wraps the two stay together. */
export default function LabelWithTip({ label, after, hint, contentClassName }: Props) {
  const { head, tail } = typeof label === 'string' ? splitLastWord(label) : { head: '', tail: label }
  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {tail}
        {after}
        {hint ? (
          <InfoTip about={typeof label === 'string' ? label : 'this figure'} className="ml-1 inline-block align-[-2px]" contentClassName={contentClassName}>
            {hint}
          </InfoTip>
        ) : null}
      </span>
    </>
  )
}
