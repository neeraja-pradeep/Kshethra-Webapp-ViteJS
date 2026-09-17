import { useCallback, useEffect, useState } from 'react'

/** Paper the counter's printer is loaded with. */
export type PaperSize = 'A4' | 'A5'

export const PAPER_SIZES: readonly PaperSize[] = ['A4', 'A5']

const STORAGE_KEY = 'ks.paper-size'
const DEFAULT_SIZE: PaperSize = 'A5'

/** The printable width of each sheet, portrait, minus the `@page` margin. */
const MARGIN_MM: Record<PaperSize, number> = { A4: 14, A5: 8 }

function isPaperSize(value: unknown): value is PaperSize {
  return value === 'A4' || value === 'A5'
}

function readStored(): PaperSize {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isPaperSize(stored) ? stored : DEFAULT_SIZE
  } catch {
    // Private mode / blocked storage — the default is still a usable receipt.
    return DEFAULT_SIZE
  }
}

/**
 * The paper the next `window.print()` targets.
 *
 * The size has to reach the `@page` rule, which no React prop can do, so it is
 * published as `--ks-paper` on `<html>` and read back by the print block in
 * `index.css`. Without it every receipt printed on A4 regardless of the tray,
 * leaving an A5-shaped card marooned in the top-left corner of the sheet.
 *
 * The choice is per-browser and sticky: a counter's printer does not change
 * between sales, and re-picking A5 on every receipt is the kind of friction
 * that gets a feature ignored.
 */
export function usePaperSize(): { paper: PaperSize; setPaper: (size: PaperSize) => void } {
  const [paper, setPaperState] = useState<PaperSize>(readStored)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--ks-paper', paper)
    root.style.setProperty('--ks-paper-margin', `${MARGIN_MM[paper]}mm`)
  }, [paper])

  const setPaper = useCallback((size: PaperSize) => {
    setPaperState(size)
    try {
      localStorage.setItem(STORAGE_KEY, size)
    } catch {
      /* the session still prints correctly, it just will not be remembered */
    }
  }, [])

  return { paper, setPaper }
}
