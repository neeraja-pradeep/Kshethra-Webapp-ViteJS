import { useEffect, useState } from 'react'

/** How long a list screen waits after the last keystroke before querying. */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * The trailing edge of a fast-changing value — one request per pause in typing,
 * not one per keystroke.
 *
 * Every server-filtered list screen held its own copy of this effect, which is
 * fine until two of them disagree about the delay and the slower one reads as a
 * bug in the API rather than in the timer.
 */
export function useDebounce<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
