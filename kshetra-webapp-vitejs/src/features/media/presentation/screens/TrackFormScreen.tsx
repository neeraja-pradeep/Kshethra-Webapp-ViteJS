import { Alert, Icon, Input, Spinner } from '@/shared/ui'
import { DeleteTrackPanel } from '@/features/media/presentation/components/DeleteTrackPanel'
import { DetailField } from '@/features/media/presentation/components/DetailField'
import { TrackAudioField } from '@/features/media/presentation/components/TrackAudioField'
import { TrackCoverField } from '@/features/media/presentation/components/TrackCoverField'
import { TrackFormHeader } from '@/features/media/presentation/components/TrackFormHeader'
import type { TrackFormMode } from '@/features/media/presentation/components/TrackFormHeader'
import { TrackPlaysStat } from '@/features/media/presentation/components/TrackPlaysStat'
import { TrackToggleRow } from '@/features/media/presentation/components/TrackToggleRow'
import { formatDuration } from '@/features/media/presentation/lib/media-format'
import type { MediaFormValues } from '@/features/media/presentation/lib/mediaForm'

export interface TrackFormErrors {
  title?: string
  artist?: string
  audio?: string
}

interface TrackFormScreenProps {
  mode: TrackFormMode
  isEditingExisting: boolean
  formTitle: string
  form: MediaFormValues
  errors: TrackFormErrors
  /** A server error with no field of its own — a 403, a 404, a dropped network. */
  banner?: string | null
  saving?: boolean
  /** The detail request is in flight, so the form has nothing to show yet. */
  loading?: boolean
  /** Lifetime plays, from the server. Null before the track exists. */
  playCount: number | null
  /** Seconds, read off the upload. */
  duration: number | null
  /** `song.delete_song`. Without it the delete panel is not drawn. */
  canDelete?: boolean
  onBack: () => void
  onStartEdit: () => void
  onSave: () => void
  onTitleChange: (value: string) => void
  onArtistChange: (value: string) => void
  onCoverUpload: (file: File) => void
  onCoverRemove: () => void
  onAudioUpload: (file: File) => void
  onHomescreenToggle: (value: boolean) => void
  onStatusToggle: (value: boolean) => void
  onAskDelete: () => void
}

/**
 * Create/edit track — full-screen overlay. Read-first (view mode) when opened
 * from a row; boxed inputs + destructive actions once "Edit" is pressed.
 */
export function TrackFormScreen({
  mode,
  isEditingExisting,
  formTitle,
  form,
  errors,
  banner = null,
  saving = false,
  loading = false,
  playCount,
  duration,
  canDelete = true,
  onBack,
  onStartEdit,
  onSave,
  onTitleChange,
  onArtistChange,
  onCoverUpload,
  onCoverRemove,
  onAudioUpload,
  onHomescreenToggle,
  onStatusToggle,
  onAskDelete,
}: TrackFormScreenProps) {
  const editable = mode === 'edit'

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <TrackFormHeader
        mode={mode}
        title={formTitle}
        onBack={onBack}
        onStartEdit={onStartEdit}
        onCancel={onBack}
        onSave={onSave}
        saving={saving}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex flex-col gap-4 px-6 pb-14 pt-6" style={{ maxWidth: 820 }}>
          {banner && (
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {banner}
            </Alert>
          )}

          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner size={32} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-5 rounded-2xl bg-card p-5.5 shadow-sm">
                <TrackCoverField
                  cover={form.coverPreview}
                  editable={editable}
                  onUpload={onCoverUpload}
                  onRemove={onCoverRemove}
                />

                <div className="flex min-w-60 flex-1 flex-col gap-4">
                  <DetailField label="Title" editing={editable} value={form.title || '—'}>
                    <Input
                      label="Title"
                      required
                      placeholder="e.g. Om Namah Shivaya (108x)"
                      value={form.title}
                      onChange={(e) => onTitleChange(e.target.value)}
                      error={errors.title}
                    />
                  </DetailField>

                  {/* Starred because the API requires it, though the original
                      design did not mark it — a blank artist is a 400. */}
                  <DetailField label="Artist" editing={editable} value={form.artist || '—'}>
                    <Input
                      label="Artist"
                      required
                      placeholder="e.g. Pandit Jasraj"
                      value={form.artist}
                      onChange={(e) => onArtistChange(e.target.value)}
                      error={errors.artist}
                    />
                  </DetailField>

                  <TrackAudioField
                    audioName={form.audioFile?.name ?? form.audioFilename}
                    editable={editable}
                    hasError={!!errors.audio}
                    errorMessage={errors.audio}
                    onUpload={onAudioUpload}
                  />

                  {duration !== null && (
                    <div className="text-xs text-ink-subtle">Duration {formatDuration(duration)}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
                {/* Legal on an inactive track — "ready but not yet live" — so this
                    is never disabled by the status below it. */}
                <TrackToggleRow
                  title="Add to app home screen"
                  hint="Feature this track on the devotee app home screen."
                  checked={form.homeScreen}
                  editable={editable}
                  activeLabel="On"
                  inactiveLabel="Off"
                  onToggle={onHomescreenToggle}
                />
                <div className="h-px bg-stroke-subtle" />
                <TrackToggleRow
                  title="Status"
                  hint="Inactive tracks are hidden from the app without deleting."
                  checked={form.active}
                  editable={editable}
                  activeLabel="Active"
                  inactiveLabel="Inactive"
                  onToggle={onStatusToggle}
                />
                {playCount !== null && (
                  <>
                    <div className="h-px bg-stroke-subtle" />
                    <TrackPlaysStat plays={playCount} editable={editable} />
                  </>
                )}
              </div>

              {isEditingExisting && canDelete && <DeleteTrackPanel editable={editable} onDelete={onAskDelete} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
