import { useEffect, useState } from 'react'
import { startBox } from './calcBox.ts'

const windowSize = () => ({ w: window.innerWidth, h: window.innerHeight })

/** Where the calculator sits: its starting place in the window, worked out again when the window changes size. */
export function useStartBox() {
  const [box, setBox] = useState(() => startBox(windowSize()))

  useEffect(() => {
    const place = () => setBox(startBox(windowSize()))
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [])

  return box
}
