import { Input } from '@/shared/ui'
import type { MediaTrackDraft } from '@/features/media/domain/entities/media-track'
import { DeleteTrackPanel } from '@/features/media/presentation/components/DeleteTrackPanel'
import { DetailField } from '@/features/media/presentation/components/DetailField'
import { TrackAudioField } from '@/features/media/presentation/components/TrackAudioField'
import { TrackCoverField } from '@/features/media/presentation/components/TrackCoverField'
import { TrackFormHeader } from '@/features/media/presentation/components/TrackFormHeader'
import type { TrackFormMode } from '@/features/media/presentation/components/TrackFormHeader'
import { TrackPlaysStat } from '@/features/media/presentation/components/TrackPlaysStat'
import { TrackToggleRow } from '@/features/media/presentation/components/TrackToggleRow'

export interface TrackFormErrors {
  title?: string
  audio?: boolean
}

interface TrackFormScreenProps {
  mode: TrackFormMode
  isEditingExisting: boolean
  formTitle: string
  form: MediaTrackDraft
  errors: TrackFormErrors
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
      <TrackFormHeader mode={mode} title={formTitle} onBack={onBack} onStartEdit={onStartEdit} onCancel={onBack} onSave={onSave} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex flex-col gap-4 px-6 pb-14 pt-6" style={{ maxWidth: 820 }}>
          <div className="flex flex-wrap gap-5 rounded-2xl bg-card p-5.5 shadow-sm">
            <TrackCoverField cover={form.cover} editable={editable} onUpload={onCoverUpload} onRemove={onCoverRemove} />

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

              <DetailField label="Artist" editing={editable} value={form.artist || '—'}>
                <Input label="Artist" placeholder="e.g. Pandit Jasraj" value={form.artist} onChange={(e) => onArtistChange(e.target.value)} />
              </DetailField>

              <TrackAudioField audioName={form.audioName} editable={editable} hasError={!!errors.audio} onUpload={onAudioUpload} />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            <TrackToggleRow
              title="Add to app home screen"
              hint="Feature this track on the devotee app home screen."
              checked={form.homescreen}
              editable={editable}
              activeLabel="On"
              inactiveLabel="Off"
              onToggle={onHomescreenToggle}
            />
            <div className="h-px bg-stroke-subtle" />
            <TrackToggleRow
              title="Status"
              hint="Inactive tracks are hidden from the app without deleting."
              checked={form.status === 'Active'}
              editable={editable}
              activeLabel="Active"
              inactiveLabel="Inactive"
              onToggle={onStatusToggle}
            />
            {form.plays != null && (
              <>
                <div className="h-px bg-stroke-subtle" />
                <TrackPlaysStat plays={form.plays} editable={editable} />
              </>
            )}
          </div>

          {isEditingExisting && <DeleteTrackPanel editable={editable} onDelete={onAskDelete} />}
        </div>
      </div>
    </div>
  )
}
