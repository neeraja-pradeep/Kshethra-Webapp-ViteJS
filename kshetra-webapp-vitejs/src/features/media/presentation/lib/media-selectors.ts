import type { MediaTrack, MediaTrackStatus } from '@/features/media/domain/entities/media-track'
import type { MediaHomeFilter, MediaStatusFilter } from '@/features/media/presentation/components/MediaFiltersBar'
import type { MediaKpi } from '@/features/media/presentation/components/MediaKpiBand'
import type { MediaSortKey } from '@/features/media/presentation/components/MediaTrackTable'

/** Search + status + home-screen filters, then alphabetical by title (the DC's base order). */
export function filterMediaTracks(
  tracks: readonly MediaTrack[],
  search: string,
  status: MediaStatusFilter,
  home: MediaHomeFilter,
): MediaTrack[] {
  const q = search.trim().toLowerCase()
  return tracks
    .filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (home === 'featured' && !t.homescreen) return false
      if (home === 'not' && t.homescreen) return false
      if (q && !`${t.title} ${t.artist}`.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

function sortValue(track: MediaTrack, key: MediaSortKey): number | string {
  if (key === 'homescreen') return track.homescreen ? 1 : 0
  if (key === 'plays') return track.plays == null ? -1 : track.plays
  return track[key]
}

/** Applies a user column sort on top of the base (filtered, title-sorted) order. */
export function sortMediaTracks(tracks: readonly MediaTrack[], key: MediaSortKey | null, dir: 'asc' | 'desc'): MediaTrack[] {
  if (!key) return [...tracks]
  const sd = dir === 'desc' ? -1 : 1
  return [...tracks].sort((a, b) => {
    const x = sortValue(a, key)
    const y = sortValue(b, key)
    if (typeof x === 'number' && typeof y === 'number') return sd * (x - y)
    return sd * String(x).localeCompare(String(y), undefined, { numeric: true })
  })
}

const STATUS_RANK: Record<MediaTrackStatus, number> = { Active: 0, Inactive: 3 }
const STATUS_DOT: Record<MediaTrackStatus, string> = { Active: 'bg-success', Inactive: 'bg-ink-disabled' }

/** Total tile + one tile per status present among the (filtered) rows, active-first. */
export function computeMediaKpis(tracks: readonly MediaTrack[]): MediaKpi[] {
  const counts = new Map<MediaTrackStatus, number>()
  const order: MediaTrackStatus[] = []
  tracks.forEach((t) => {
    if (!counts.has(t.status)) order.push(t.status)
    counts.set(t.status, (counts.get(t.status) ?? 0) + 1)
  })
  order.sort((a, b) => STATUS_RANK[a] - STATUS_RANK[b])
  return [
    { key: 'total', value: String(tracks.length), label: 'tracks' },
    ...order.map((status) => ({ key: status, value: String(counts.get(status) ?? 0), label: status, dotClassName: STATUS_DOT[status] })),
  ]
}
