import { useEffect, useMemo, useRef, useState } from 'react'

import { Spinner } from '@/shared/ui'
import type { MediaTrack, MediaTrackDraft } from '@/features/media/domain/entities/media-track'
import { MEDIA_TRACKS } from '@/features/media/presentation/data/media-tracks.mock'
import { computeMediaKpis, filterMediaTracks, sortMediaTracks } from '@/features/media/presentation/lib/media-selectors'
import { FilteredEmptyState } from '@/features/media/presentation/components/FilteredEmptyState'
import { MediaFiltersBar } from '@/features/media/presentation/components/MediaFiltersBar'
import type { MediaHomeFilter, MediaStatusFilter } from '@/features/media/presentation/components/MediaFiltersBar'
import { MediaHeader } from '@/features/media/presentation/components/MediaHeader'
import { MediaPagination } from '@/features/media/presentation/components/MediaPagination'
import { MediaKpiBand } from '@/features/media/presentation/components/MediaKpiBand'
import { MediaToast } from '@/features/media/presentation/components/MediaToast'
import { MediaTrackTable } from '@/features/media/presentation/components/MediaTrackTable'
import type { MediaSortKey } from '@/features/media/presentation/components/MediaTrackTable'
import { TrackConfirmModal } from '@/features/media/presentation/components/TrackConfirmModal'
import type { TrackFormMode } from '@/features/media/presentation/components/TrackFormHeader'

import { TrackFormScreen } from './TrackFormScreen'
import type { TrackFormErrors } from './TrackFormScreen'

type MediaConfirmKind = 'discard' | 'deactivate' | 'delete'

interface MediaConfirmState {
  open: boolean
  kind?: MediaConfirmKind
  id?: string
}

interface MediaToastState {
  show: boolean
  message: string
}

function blankForm(): MediaTrackDraft {
  return { title: '', artist: '', audioName: '', cover: null, homescreen: false, status: 'Active', plays: null }
}

const TOAST_DURATION_MS = 2400
const LOADING_PULSE_MS = 260

/** Media library — list (KPIs, search, filters, table, pagination) + track detail/create form. */
export function MediaScreen() {
  const [tracks, setTracks] = useState<MediaTrack[]>(MEDIA_TRACKS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<MediaStatusFilter>('all')
  const [filterHome, setFilterHome] = useState<MediaHomeFilter>('any')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortKey, setSortKey] = useState<MediaSortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MediaTrackDraft>(blankForm())
  const [errors, setErrors] = useState<TrackFormErrors>({})

  const [confirm, setConfirm] = useState<MediaConfirmState>({ open: false })
  const [toast, setToast] = useState<MediaToastState>({ show: false, message: '' })

  const formSignatureRef = useRef<string | null>(null)
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Brief loading pulse on mount and whenever a filter changes (matches the DC prototype).
  useEffect(() => {
    setLoading(true)
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = setTimeout(() => setLoading(false), LOADING_PULSE_MS)
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterHome])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const mode: TrackFormMode = formView && editingId ? 'view' : 'edit'

  const filteredTracks = useMemo(() => filterMediaTracks(tracks, search, filterStatus, filterHome), [tracks, search, filterStatus, filterHome])
  const sortedTracks = useMemo(() => sortMediaTracks(filteredTracks, sortKey, sortDir), [filteredTracks, sortKey, sortDir])
  const kpis = useMemo(() => computeMediaKpis(filteredTracks), [filteredTracks])

  const total = sortedTracks.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pageRows = sortedTracks.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
  const pageInfo = total ? `Showing ${currentPage * pageSize + 1}–${Math.min(total, (currentPage + 1) * pageSize)} of ${total} tracks` : 'No tracks'
  const pageLabel = `Page ${currentPage + 1} of ${totalPages}`
  const hasActiveFilters = search.trim() !== '' || filterStatus !== 'all' || filterHome !== 'any'

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_DURATION_MS)
  }

  function handleClearFilters() {
    setSearch('')
    setFilterStatus('all')
    setFilterHome('any')
    setPage(0)
  }

  function handleSort(key: MediaSortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function handlePrev() {
    setPage((p) => Math.max(0, p - 1))
  }
  function handleNext() {
    setPage((p) => Math.min(totalPages - 1, p + 1))
  }

  function handleAddTrack() {
    const blank = blankForm()
    formSignatureRef.current = JSON.stringify(blank)
    setForm(blank)
    setErrors({})
    setEditingId(null)
    setFormView(false)
    setFormOpen(true)
  }

  function handleRowClick(track: MediaTrack) {
    const draft: MediaTrackDraft = {
      title: track.title,
      artist: track.artist,
      audioName: track.audioName,
      cover: track.cover,
      homescreen: track.homescreen,
      plays: track.plays,
      status: track.status,
    }
    formSignatureRef.current = JSON.stringify(draft)
    setForm(draft)
    setErrors({})
    setEditingId(track.id)
    setFormView(true)
    setFormOpen(true)
  }

  function handleStartEdit() {
    setFormView(false)
  }

  function handleCancel() {
    if (mode === 'edit' && formSignatureRef.current && JSON.stringify(form) !== formSignatureRef.current && !confirm.open) {
      setConfirm({ open: true, kind: 'discard' })
      return
    }
    formSignatureRef.current = null
    setFormOpen(false)
    setEditingId(null)
  }

  function handleSave() {
    const title = form.title.trim()
    const nextErrors: TrackFormErrors = {}
    if (!title) nextErrors.title = 'Title is required.'
    if (!form.audioName.trim()) nextErrors.audio = true
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setTracks((prev) => {
      if (editingId) {
        return prev.map((t) =>
          t.id === editingId
            ? { ...t, title, artist: form.artist, audioName: form.audioName, cover: form.cover, homescreen: form.homescreen, status: form.status }
            : t,
        )
      }
      const newTrack: MediaTrack = {
        id: `MD-${prev.length + 1}-${Date.now().toString(36)}`,
        title,
        artist: form.artist,
        audioName: form.audioName,
        cover: form.cover,
        homescreen: form.homescreen,
        plays: null,
        status: form.status,
      }
      return [newTrack, ...prev]
    })

    formSignatureRef.current = null
    setFormOpen(false)
    setEditingId(null)
    setErrors({})
    showToast('Track saved')
  }

  function handleAskDelete() {
    if (!editingId) return
    setConfirm({ open: true, kind: 'delete', id: editingId })
  }

  function handleToggleStatus(track: MediaTrack) {
    if (track.status === 'Active') {
      setConfirm({ open: true, kind: 'deactivate', id: track.id })
      return
    }
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, status: 'Active' } : t)))
    showToast(`${track.title} activated`)
  }

  function handleConfirmNo() {
    setConfirm({ open: false })
  }

  function handleConfirmYes() {
    const { kind, id } = confirm
    if (kind === 'discard') {
      formSignatureRef.current = null
      setFormOpen(false)
      setEditingId(null)
      setConfirm({ open: false })
      return
    }
    const track = tracks.find((t) => t.id === id)
    if (kind === 'deactivate' && id) {
      setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Inactive' } : t)))
      setForm((prev) => (editingId === id ? { ...prev, status: 'Inactive' } : prev))
      setConfirm({ open: false })
      showToast(`${track ? track.title : 'Track'} set inactive`)
      return
    }
    if (kind === 'delete' && id) {
      setTracks((prev) => prev.filter((t) => t.id !== id))
      setConfirm({ open: false })
      setFormOpen(false)
      setEditingId(null)
      showToast(`${track ? track.title : 'Track'} deleted`)
      return
    }
    setConfirm({ open: false })
  }

  // Escape closes the confirm dialog, else the open form.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirm.open) {
        handleConfirmNo()
        return
      }
      if (formOpen) handleCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm.open, formOpen, form, mode])

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
    confirmTitle = 'Delete track?'
    confirmBody = 'This track will be permanently removed from the library. This can’t be undone.'
    confirmActionLabel = 'Delete'
  }

  const formTitle = editingId ? form.title || 'Edit track' : 'New track'
  const emptyState = hasActiveFilters ? <FilteredEmptyState message="No tracks match your filters." onClearFilters={handleClearFilters} /> : 'No tracks yet.'

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        <MediaHeader onAddTrack={handleAddTrack} />
        <MediaFiltersBar
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
          status={filterStatus}
          onStatusChange={(v) => {
            setFilterStatus(v)
            setPage(0)
          }}
          home={filterHome}
          onHomeChange={(v) => {
            setFilterHome(v)
            setPage(0)
          }}
        />
        <MediaKpiBand kpis={kpis} />

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        ) : (
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <MediaTrackTable
                rows={pageRows}
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
            setPage(0)
          }}
          pageLabel={pageLabel}
          prevDisabled={currentPage <= 0}
          nextDisabled={currentPage >= totalPages - 1}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      {formOpen && (
        <TrackFormScreen
          mode={mode}
          isEditingExisting={!!editingId}
          formTitle={formTitle}
          form={form}
          errors={errors}
          onBack={handleCancel}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          onTitleChange={(v) => setForm((prev) => ({ ...prev, title: v }))}
          onArtistChange={(v) => setForm((prev) => ({ ...prev, artist: v }))}
          onCoverUpload={(file) => {
            const reader = new FileReader()
            reader.onload = () => setForm((prev) => ({ ...prev, cover: typeof reader.result === 'string' ? reader.result : prev.cover }))
            reader.readAsDataURL(file)
          }}
          onCoverRemove={() => setForm((prev) => ({ ...prev, cover: null }))}
          onAudioUpload={(file) => setForm((prev) => ({ ...prev, audioName: file.name }))}
          onHomescreenToggle={(v) => setForm((prev) => ({ ...prev, homescreen: v }))}
          onStatusToggle={(v) => setForm((prev) => ({ ...prev, status: v ? 'Active' : 'Inactive' }))}
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
