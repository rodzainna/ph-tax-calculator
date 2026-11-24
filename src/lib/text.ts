/** Splits a label before its last word, so something that follows it (a tip button) stays with that word instead of wrapping alone. */
export function splitLastWord(text: string): { head: string; tail: string } {
  const lastSpace = text.lastIndexOf(' ')
  return lastSpace > 0
    ? { head: text.slice(0, lastSpace + 1), tail: text.slice(lastSpace + 1) }
    : { head: '', tail: text }
}
