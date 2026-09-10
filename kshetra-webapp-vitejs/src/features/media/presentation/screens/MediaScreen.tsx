import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useCreateMediaTrackMutation,
  useDeleteMediaTrackMutation,
  useMediaTrackHomeScreenMutation,
  useMediaTrackStatusMutation,
  useUpdateMediaTrackMutation,
} from '@/features/media/application/queries/useMediaMutations'
import {
  useMediaTrackQuery,
  useMediaTracksQuery,
} from '@/features/media/application/queries/useMediaQueries'
import type { MediaTrack } from '@/features/media/domain/entities/media-track'
import type { MediaFilters } from '@/features/media/domain/repositories/media.repository'
import { FilteredEmptyState } from '@/features/media/presentation/components/FilteredEmptyState'
import { MediaFiltersBar } from '@/features/media/presentation/components/MediaFiltersBar'
import type { MediaHomeFilter, MediaStatusFilter } from '@/features/media/presentation/components/MediaFiltersBar'
import { MediaHeader } from '@/features/media/presentation/components/MediaHeader'
import { MediaKpiBand } from '@/features/media/presentation/components/MediaKpiBand'
import type { MediaKpi } from '@/features/media/presentation/components/MediaKpiBand'
import { MediaPagination } from '@/features/media/presentation/components/MediaPagination'
import { MediaToast } from '@/features/media/presentation/components/MediaToast'
import { MediaTrackTable } from '@/features/media/presentation/components/MediaTrackTable'
import type { MediaSortKey } from '@/features/media/presentation/components/MediaTrackTable'
import { TrackConfirmModal } from '@/features/media/presentation/components/TrackConfirmModal'
import {
  audioFileError,
  blankMediaForm,
  mediaFormFromTrack,
  toMediaWrite,
  type MediaFormValues,
} from '@/features/media/presentation/lib/mediaForm'

import { TrackFormScreen } from './TrackFormScreen'
import type { TrackFormErrors } from './TrackFormScreen'

type MediaConfirmKind = 'discard' | 'deactivate' | 'delete'

interface MediaConfirmState {
  open: boolean
  kind?: MediaConfirmKind
  id?: number
}

const TOAST_DURATION_MS = 2400
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const DEFAULT_PAGE_SIZE = 20

/** The server's ordering vocabulary is already the sort key — no translation needed. */
const EMPTY_SUMMARY = { total: 0, active: 0, inactive: 0 }

/**
 * Media library — list (tiles, search, filters, table, pagination) plus the
 * track detail/create form. Route: `/media`.
 *
 * The search, both filters, the sort and the paging are all applied by the
 * server, and the tiles come from its `summary`. None of it is done here: the
 * list is paged, so filtering the loaded rows would report one page's matches
 * as though it were the whole library.
 */
export function MediaScreen() {
  const can = useCan()
  /** App Manager is a full writer here, unlike on the Agent code screen. */
  const canWrite = can(PERMISSIONS.addSong)
  const canDelete = can(PERMISSIONS.deleteSong)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<MediaStatusFilter>('all')
  const [filterHome, setFilterHome] = useState<MediaHomeFilter>('any')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortKey, setSortKey] = useState<MediaSortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MediaFormValues>(blankMediaForm())
  const [localErrors, setLocalErrors] = useState<TrackFormErrors>({})

  const [confirm, setConfirm] = useState<MediaConfirmState>({ open: false })
  const [toast, setToast] = useState({ show: false, message: '' })

  const formSignature = useRef<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Object URLs for locally-picked covers, revoked so previews do not leak. */
  const previewUrl = useRef<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    },
    [],
  )

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_DURATION_MS)
  }

  const filters: MediaFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(filterStatus === 'all' ? {} : { status: filterStatus }),
      ...(filterHome === 'any' ? {} : { homeScreen: filterHome }),
      ...(sortKey ? { ordering: `${sortDir === 'desc' ? '-' : ''}${sortKey}` } : {}),
      page,
      pageSize,
    }),
    [debouncedSearch, filterStatus, filterHome, sortKey, sortDir, page, pageSize],
  )

  const tracksQuery = useMediaTracksQuery(filters)
  const detailQuery = useMediaTrackQuery(formOpen ? editingId : null)
  const createTrack = useCreateMediaTrackMutation()
  const updateTrack = useUpdateMediaTrackMutation()
  const statusMutation = useMediaTrackStatusMutation()
  const homeScreenMutation = useMediaTrackHomeScreenMutation()
  const deleteMutation = useDeleteMediaTrackMutation()

  const rows = useMemo(() => tracksQuery.data?.results ?? [], [tracksQuery.data])
  const summary = tracksQuery.data?.summary ?? EMPTY_SUMMARY
  const total = tracksQuery.data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const detail = detailQuery.data ?? null
  const saving = createTrack.isPending || updateTrack.isPending

  /** Straight from `summary` — it ignores the status filter by design. */
  const kpis: MediaKpi[] = [
    { key: 'total', value: String(summary.total), label: 'tracks' },
    { key: 'active', value: String(summary.active), label: 'Active', dotClassName: 'bg-success' },
    { key: 'inactive', value: String(summary.inactive), label: 'Inactive', dotClassName: 'bg-ink-disabled' },
  ]

  const hasActiveFilters = debouncedSearch !== '' || filterStatus !== 'all' || filterHome !== 'any'

  function resetPaging() {
    setPage(1)
  }

  function setPreview(url: string | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = url
  }

  function closeForm() {
    formSignature.current = null
    setPreview(null)
    setFormOpen(false)
    setEditingId(null)
    setLocalErrors({})
    createTrack.reset()
    updateTrack.reset()
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterStatus('all')
    setFilterHome('any')
    resetPaging()
  }

  const handleSort = (key: MediaSortKey) => {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    resetPaging()
  }

  const handleAddTrack = () => {
    const initial = blankMediaForm()
    formSignature.current = JSON.stringify(initial)
    setPreview(null)
    setForm(initial)
    setLocalErrors({})
    createTrack.reset()
    updateTrack.reset()
    setEditingId(null)
    setFormView(false)
    setFormOpen(true)
  }

  const handleRowClick = (track: MediaTrack) => {
    setEditingId(track.id)
    setFormView(true)
    setFormOpen(true)
    setLocalErrors({})
    createTrack.reset()
    updateTrack.reset()
  }

  /** The form is seeded once the detail lands, so an edit starts from the server's copy. */
  useEffect(() => {
    if (!detail || editingId === null) return
    const seeded = mediaFormFromTrack(detail)
    formSignature.current = JSON.stringify({ ...seeded, coverFile: null })
    setPreview(null)
    setForm(seeded)
  }, [detail, editingId])

  const handleStartEdit = () => setFormView(false)

  function handleCancel() {
    const dirty =
      formSignature.current != null &&
      !formView &&
      JSON.stringify({ ...form, coverFile: null }) !== formSignature.current
    if (dirty && !confirm.open) {
      setConfirm({ open: true, kind: 'discard' })
      return
    }
    closeForm()
  }

  /**
   * Checked at pick time rather than on save: the file is refused before an
   * upload is spent on it, and the message names the real size, which the
   * server's own floor-divided one cannot at the boundary.
   */
  const handleAudioUpload = (file: File) => {
    const problem = audioFileError(file)
    if (problem) {
      setLocalErrors((prev) => ({ ...prev, audio: problem }))
      return
    }
    setLocalErrors((prev) => ({ ...prev, audio: undefined }))
    setForm((prev) => ({ ...prev, audioFile: file }))
  }

  const handleSave = () => {
    const nextErrors: TrackFormErrors = {}
    if (!form.title.trim()) nextErrors.title = 'A title is required.'
    /* Required by the API even though the original design did not star it —
       a blank artist is the most likely cause of a silently failing save. */
    if (!form.artist.trim()) nextErrors.artist = 'An artist is required.'
    if (editingId === null && !form.audioFile) nextErrors.audio = 'Attach an audio file.'
    if (Object.keys(nextErrors).length) {
      setLocalErrors(nextErrors)
      return
    }
    setLocalErrors({})
    const input = toMediaWrite(form)
    const onDone = (message: string) => () => {
      closeForm()
      showToast(message)
    }
    if (editingId === null) createTrack.mutate(input, { onSuccess: onDone('Track added') })
    else updateTrack.mutate({ id: editingId, input }, { onSuccess: onDone('Track saved') })
  }

  const handleToggleStatus = (track: MediaTrack) => {
    if (track.status === 'active') {
      setConfirm({ open: true, kind: 'deactivate', id: track.id })
      return
    }
    statusMutation.mutate(
      { id: track.id, status: 'active' },
      { onSuccess: () => showToast(`${track.title} activated`) },
    )
  }

  const handleAskDelete = () => setConfirm({ open: true, kind: 'delete', id: editingId ?? undefined })

  const handleConfirmNo = () => setConfirm({ open: false })

  const handleConfirmYes = () => {
    if (confirm.kind === 'discard') {
      closeForm()
      setConfirm({ open: false })
      return
    }
    const id = confirm.id
    if (id === undefined) {
      setConfirm({ open: false })
      return
    }
    const label = rows.find((t) => t.id === id)?.title ?? detail?.title ?? 'Track'
    if (confirm.kind === 'deactivate') {
      statusMutation.mutate(
        { id, status: 'inactive' },
        {
          onSuccess: () => {
            if (editingId === id) setForm((prev) => ({ ...prev, active: false }))
            showToast(`${label} set inactive`)
          },
        },
      )
      setConfirm({ open: false })
      return
    }
    if (confirm.kind === 'delete') {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          closeForm()
          showToast(`${label} deleted`)
        },
      })
      setConfirm({ open: false })
      return
    }
    setConfirm({ open: false })
  }

  /**
   * The home-screen switch writes through its own endpoint the moment it is
   * flipped on an existing track — it is one field, and routing it through the
   * form's save would make it wait on a title the operator may not have touched.
   */
  const handleHomescreenToggle = (value: boolean) => {
    setForm((prev) => ({ ...prev, homeScreen: value }))
    if (editingId !== null) homeScreenMutation.mutate({ id: editingId, homeScreen: value })
  }

  const listFailure = tracksQuery.isError
    ? (toFailure(tracksQuery.error)?.message ?? 'The media library could not be loaded.')
    : null
  const writeFailure = toFailure(createTrack.error) ?? toFailure(updateTrack.error)
  const serverFieldErrors = writeFailure?.kind === 'validation' ? writeFailure.fieldErrors : {}
  const deleteFailure = deleteMutation.isError
    ? (toFailure(deleteMutation.error)?.message ?? 'This track could not be deleted.')
    : null

  /** The server's field errors win over the local ones — it validates more. */
  const formErrors: TrackFormErrors = {
    title: serverFieldErrors.title?.[0] ?? localErrors.title,
    artist: serverFieldErrors.artist?.[0] ?? localErrors.artist,
    audio: serverFieldErrors.audio_file?.[0] ?? localErrors.audio,
  }
  const formBanner =
    writeFailure && Object.keys(serverFieldErrors).length === 0 ? writeFailure.message : null

  let confirmTitle = ''
  let confirmBody = ''
  let confirmActionLabel = 'Confirm'
  if (confirm.kind === 'discard') {
    confirmTitle = 'Discard changes?'
    confirmBody = 'Your unsaved changes to this track will be lost.'
    confirmActionLabel = 'Discard'
  } else if (confirm.kind === 'deactivate') {
    confirmTitle = 'Set track inactive?'
    confirmBody = 'It will be hidden from the app until reactivated.'
    confirmActionLabel = 'Set inactive'
  } else if (confirm.kind === 'delete') {
    /* There is no server-side guard and no undo — the audio and both images go
       with it — so the wording carries the whole warning. */
    confirmTitle = 'Delete track?'
    confirmBody =
      'This permanently removes the track, its audio and its artwork. This can’t be undone — to merely retire it, set it inactive instead.'
    confirmActionLabel = 'Delete'
  }

  const formTitle = editingId !== null ? form.title || 'Edit track' : 'New track'
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(total, page * pageSize)
  const pageInfo = total ? `Showing ${firstRow}–${lastRow} of ${total} tracks` : 'No tracks'
  const pageLabel = `Page ${page} of ${totalPages}`

  const emptyState = hasActiveFilters ? (
    <FilteredEmptyState message="No tracks match your filters." onClearFilters={handleClearFilters} />
  ) : (
    'No tracks yet.'
  )

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        {/* Hidden rather than disabled for a read-only role — the API would 403. */}
        <MediaHeader onAddTrack={canWrite ? handleAddTrack : undefined} />
        <MediaFiltersBar
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            resetPaging()
          }}
          status={filterStatus}
          onStatusChange={(v) => {
            setFilterStatus(v)
            resetPaging()
          }}
          home={filterHome}
          onHomeChange={(v) => {
            setFilterHome(v)
            resetPaging()
          }}
        />
        <MediaKpiBand kpis={kpis} />

        {(listFailure || deleteFailure) && (
          <div className="px-7 pb-3">
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {listFailure ?? deleteFailure}
            </Alert>
          </div>
        )}

        {tracksQuery.isPending ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        ) : (
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <MediaTrackTable
                rows={[...rows]}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={handleRowClick}
                onToggleStatus={handleToggleStatus}
                empty={emptyState}
              />
            </div>
          </div>
        )}

        <MediaPagination
          pageInfo={pageInfo}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            resetPaging()
          }}
          pageLabel={pageLabel}
          prevDisabled={page <= 1}
          nextDisabled={page >= totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      {formOpen && (
        <TrackFormScreen
          mode={formView && editingId !== null ? 'view' : 'edit'}
          isEditingExisting={editingId !== null}
          formTitle={formTitle}
          form={form}
          errors={formErrors}
          banner={formBanner}
          saving={saving}
          loading={editingId !== null && detailQuery.isPending}
          playCount={detail?.playCount ?? null}
          duration={detail?.duration ?? null}
          canDelete={canDelete}
          onBack={handleCancel}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          onTitleChange={(v) => setForm((prev) => ({ ...prev, title: v }))}
          onArtistChange={(v) => setForm((prev) => ({ ...prev, artist: v }))}
          onCoverUpload={(file) => {
            const url = URL.createObjectURL(file)
            setPreview(url)
            setForm((prev) => ({ ...prev, coverFile: file, coverPreview: url, coverCleared: false }))
          }}
          onCoverRemove={() => {
            setPreview(null)
            setForm((prev) => ({ ...prev, coverFile: null, coverPreview: null, coverCleared: true }))
          }}
          onAudioUpload={handleAudioUpload}
          onHomescreenToggle={handleHomescreenToggle}
          onStatusToggle={(v) => setForm((prev) => ({ ...prev, active: v }))}
          onAskDelete={handleAskDelete}
        />
      )}

      <TrackConfirmModal
        open={confirm.open}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={confirmActionLabel}
        onCancel={handleConfirmNo}
        onConfirm={handleConfirmYes}
      />

      <MediaToast show={toast.show} message={toast.message} />
    </div>
  )
}
