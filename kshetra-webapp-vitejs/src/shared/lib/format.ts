/** Shared formatting helpers (Indian conventions). Pure, presentation-safe. */

/** ₹ with Indian digit grouping, e.g. 1500 → "₹1,500". Blank/invalid → em-dash. */
export function formatINR(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (n == null || Number.isNaN(n)) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

/** Bare integer with Indian grouping, e.g. 12000 → "12,000". */
export function formatCount(n: number): string {
  return n.toLocaleString('en-IN')
}

/**
 * Deterministic inline SVG thumbnail (data URI) — a coloured tile with a short
 * label. Mirrors the prototype's placeholder artwork for gods/poojas/products.
 */
export function svgThumb(label: string, bg: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" fill="${bg}"/>` +
    `<text x="48" y="60" font-family="sans-serif" font-size="36" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>` +
    `</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}
