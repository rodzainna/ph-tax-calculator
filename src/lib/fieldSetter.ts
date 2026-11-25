/** `set('basic')` gives the function that saves a new `basic`, keeping the rest of the object as it is. */
export function fieldSetter<S extends object>(state: S, onChange: (next: S) => void) {
  return <K extends keyof S>(key: K) =>
    (value: S[K]) =>
      onChange({ ...state, [key]: value })
}
