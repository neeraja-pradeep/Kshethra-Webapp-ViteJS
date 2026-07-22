/** Media-feature-local presentation helpers (pure, no React). */

/** Track-row avatar palette — deterministic pick per id, mirrors the DC seed. */
const AVATAR_PALETTE = ['#8C001A', '#A8761A', '#1F6F8C', '#1F6F5C', '#5E6AD2', '#9A3B6E'] as const

/** Deterministic hash of an id into the avatar palette (stable across renders). */
export function avatarColorFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[hash]
}

/** Up to two uppercase letters from a title, falling back to the Om glyph. */
export function initialsFor(title: string): string {
  const letters = (title || '?').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
  return letters || 'ॐ'
}

/** Compact play count, e.g. 18420 -> "18K", 9120 -> "9.1K". Em-dash when unset. */
export function formatPlayCount(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K'
  return String(n)
}
