import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import {
  caretAfterFormat,
  charsBeforeCaret,
  formatPesoInput,
  isRefusedEdit,
  parsePastedAmount,
  parsePeso,
  removedCharacter,
} from './peso.ts'

/**
 * The behaviour of a money text box: commas as you type, the cursor kept where it was,
 * and "1,000.5" tidied to "1,000.50" when you leave the field.
 * `invalid` is true after an entry was refused. It stays on blur, so removing the message cannot move what is being
 * clicked. It clears on the next accepted entry, on focusing the field again, or when the amount changes elsewhere.
 */
export function usePesoField(value: string, onChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  // The amount that was kept when an entry was refused. The message is about that amount only.
  const [keptAmount, setKeptAmount] = useState<string | null>(null)
  // Forgotten as soon as the value is something else, so it cannot return if that amount does.
  if (keptAmount !== null && keptAmount !== value) setKeptAmount(null)
  const invalid = keptAmount === value

  // React puts the cursor at the end when it rewrites the text, so move it back once the event is done.
  const moveCaretLater = (position: number) =>
    queueMicrotask(() => {
      const input = inputRef.current
      if (input && document.activeElement === input) input.setSelectionRange(position, position)
    })

  /**
   * Takes text that arrives in one go, such as a paste. It replaces the whole amount, and only if it is clearly one:
   * nothing is guessed from it. Says whether it was taken.
   */
  const enterWhole = (text: string): boolean => {
    const amount = parsePastedAmount(text)
    if (amount === null) {
      setKeptAmount(value)
      return false
    }
    setKeptAmount(null)
    onChange(amount)
    moveCaretLater(amount.length)
    return true
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const caret = e.target.selectionStart ?? raw.length
    const { inputType, data } = e.nativeEvent as InputEvent
    // After a refusal the cursor goes back to where it was, or to the end of a selection. Delete never moved it.
    const restoreCaret = () =>
      moveCaretLater(inputType === 'deleteContentForward' ? caret : caret - (raw.length - value.length))

    // A keyboard can put text in without a paste event, such as a clipboard suggestion. Anything longer than one
    // character that is not just digits is checked like a paste, except while the keyboard is still composing it.
    if (data && data.length > 1 && /\D/.test(data) && inputType !== 'insertCompositionText') {
      if (!enterWhole(data)) restoreCaret()
      return
    }
    // Refused whole, since trimming would leave a different amount.
    if (isRefusedEdit(raw, value, caret)) {
      setKeptAmount(value)
      restoreCaret()
      return
    }
    let before = raw.slice(0, caret)
    let after = raw.slice(caret)
    // Deleting a comma changes nothing once the commas are put back, so the key would seem dead:
    // take the digit next to the comma instead.
    if (removedCharacter(value, raw) === ',') {
      if (inputType === 'deleteContentBackward') before = before.slice(0, -1)
      else if (inputType === 'deleteContentForward') after = after.slice(1)
    }
    const text = before + after
    const formatted = formatPesoInput(text)
    const nextCaret = caretAfterFormat(formatted, charsBeforeCaret(text, before))
    onChange(formatted)
    moveCaretLater(nextCaret)
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    enterWhole(e.clipboardData.getData('text'))
  }

  // Dragging is off, both in and out: moving some of the digits with the mouse would change the amount.
  const preventDrag = (e: DragEvent<HTMLInputElement>) => e.preventDefault()

  const handleFocus = () => setKeptAmount(null)

  const handleBlur = () => {
    const number = parsePeso(value)
    if (value.trim() !== '' && Number.isFinite(number) && number !== 0) {
      const hasDecimals = /\.\d/.test(value)
      const tidied = number.toLocaleString('en-PH', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      })
      // Tidying is not a change of amount, so a message about it stays.
      if (keptAmount !== null) setKeptAmount(tidied)
      onChange(tidied)
    }
  }

  return { inputRef, invalid, handleChange, handlePaste, preventDrag, handleFocus, handleBlur }
}
