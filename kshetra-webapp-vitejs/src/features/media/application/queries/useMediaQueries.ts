import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { mediaKeys } from '@/features/media/application/queries/media.keys'
import { fetchMediaTrack } from '@/features/media/application/usecases/fetchMediaTrack'
import { fetchMediaTracks } from '@/features/media/application/usecases/fetchMediaTracks'
import type { MediaFilters } from '@/features/media/domain/repositories/media.repository'

/**
 * One page of the library, and the tiles above it.
 *
 * `keepPreviousData` stops the table blanking on every keystroke, page turn and
 * filter change: the previous page stays on screen until the new one lands.
 */
export function useMediaTracksQuery(filters: MediaFilters) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: async () => unwrap(await fetchMediaTracks(filters)),
    placeholderData: keepPreviousData,
  })
}

/**
 * One track in full. Only fetched while its page is open — the audio filename,
 * the home-screen art and the duration are a second call the table never needs.
 */
export function useMediaTrackQuery(id: number | null) {
  return useQuery({
    queryKey: mediaKeys.detail(id ?? 0),
    queryFn: async () => unwrap(await fetchMediaTrack(id as number)),
    enabled: id !== null,
  })
}
