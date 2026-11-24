import { useRef, type ChangeEvent } from 'react'
import {
  caretAfterFormat,
  countPesoChars,
  formatPesoInput,
  MAX_WHOLE_DIGITS,
  parsePeso,
  removedCharacter,
  wholeDigitCount,
} from './peso.ts'

/**
 * The behaviour of a money text box: commas as you type, the cursor kept where it was,
 * and "1,000.5" tidied to "1,000.50" when you leave the field.
 */
export function usePesoField(value: string, onChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null)

  // React puts the cursor at the end when it rewrites the text, so move it back once the event is done.
  const moveCaretLater = (position: number) =>
    queueMicrotask(() => {
      const input = inputRef.current
      if (input && document.activeElement === input) input.setSelectionRange(position, position)
    })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const caret = e.target.selectionStart ?? raw.length
    const inputType = (e.nativeEvent as InputEvent).inputType
    // A digit typed into a full field is refused, rather than pushing the last digit out of the number.
    if (
      inputType === 'insertText' &&
      wholeDigitCount(raw) > MAX_WHOLE_DIGITS &&
      wholeDigitCount(value) >= MAX_WHOLE_DIGITS
    ) {
      moveCaretLater(caret - 1)
      return
    }
    let before = raw.slice(0, caret)
    let after = raw.slice(caret)
    // Deleting a comma changes nothing once the commas are put back, so the key would seem dead:
    // take the digit next to the comma instead, the way you would expect.
    if (removedCharacter(value, raw) === ',') {
      if (inputType === 'deleteContentBackward') before = before.slice(0, -1)
      else if (inputType === 'deleteContentForward') after = after.slice(1)
    }
    const formatted = formatPesoInput(before + after)
    const nextCaret = caretAfterFormat(formatted, countPesoChars(before))
    onChange(formatted)
    moveCaretLater(nextCaret)
  }

  const handleBlur = () => {
    const number = parsePeso(value)
    if (value.trim() !== '' && Number.isFinite(number) && number !== 0) {
      const hasDecimals = /\.\d/.test(value)
      onChange(number.toLocaleString('en-PH', { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 }))
    }
  }

  return { inputRef, handleChange, handleBlur }
}
