import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { mediaKeys } from '@/features/media/application/queries/media.keys'
import { createMediaTrack } from '@/features/media/application/usecases/createMediaTrack'
import { deleteMediaTrack } from '@/features/media/application/usecases/deleteMediaTrack'
import { setMediaTrackHomeScreen } from '@/features/media/application/usecases/setMediaTrackHomeScreen'
import { setMediaTrackStatus } from '@/features/media/application/usecases/setMediaTrackStatus'
import { updateMediaTrack } from '@/features/media/application/usecases/updateMediaTrack'
import type { MediaTrackStatus, MediaTrackWrite } from '@/features/media/domain/entities/media-track'

/**
 * Every write invalidates the lists: the status toggle moves a tile, and its
 * own response deliberately carries no `summary` to splice back in.
 */
function useMediaInvalidation() {
  const queryClient = useQueryClient()
  return useCallback(
    (id?: number) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: mediaKeys.lists() }),
        ...(id === undefined ? [] : [queryClient.invalidateQueries({ queryKey: mediaKeys.detail(id) })]),
      ]),
    [queryClient],
  )
}

export function useCreateMediaTrackMutation() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: async (input: MediaTrackWrite) => unwrap(await createMediaTrack(input)),
    onSuccess: () => invalidate(),
  })
}

export function useUpdateMediaTrackMutation() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: MediaTrackWrite }) =>
      unwrap(await updateMediaTrack(id, input)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useMediaTrackStatusMutation() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MediaTrackStatus }) =>
      unwrap(await setMediaTrackStatus(id, status)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useMediaTrackHomeScreenMutation() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: async ({ id, homeScreen }: { id: number; homeScreen: boolean }) =>
      unwrap(await setMediaTrackHomeScreen(id, homeScreen)),
    onSuccess: (_result, { id }) => invalidate(id),
  })
}

export function useDeleteMediaTrackMutation() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deleteMediaTrack(id)),
    onSuccess: () => invalidate(),
  })
}
