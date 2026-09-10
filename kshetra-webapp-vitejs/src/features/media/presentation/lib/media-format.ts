/** Media-feature-local presentation helpers (pure, no React). */

/** Track-row avatar palette — deterministic pick per id, mirrors the DC seed. */
const AVATAR_PALETTE = ['#8C001A', '#A8761A', '#1F6F8C', '#1F6F5C', '#5E6AD2', '#9A3B6E'] as const

/** Deterministic hash of an id into the avatar palette (stable across renders). */
export function avatarColorFor(id: number | string): string {
  const key = String(id)
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[hash]
}

/** Up to two uppercase letters from a title, falling back to the Om glyph. */
export function initialsFor(title: string): string {
  const letters = (title || '?').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
  return letters || 'ॐ'
}

/**
 * Compact play count for the table, e.g. 18420 -> "18K", 9120 -> "9.1K".
 *
 * The API never rounds — `play_count` is exact — so this rounding is the
 * table's alone. The detail page prints the full figure off the same field.
 */
export function formatPlayCount(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K'
  return String(n)
}

/** The exact figure, grouped — what the detail page's stat prints. */
export function formatExactPlayCount(n: number | null): string {
  return n == null ? '—' : n.toLocaleString('en-IN')
}

/** Seconds as a float -> `MM:SS`. The API sends `421.0`; the screen shows 7:01. */
export function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** The wire value is lower-case; the screen prints it capitalised. */
export function mediaStatusLabel(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'Active' : 'Inactive'
}
