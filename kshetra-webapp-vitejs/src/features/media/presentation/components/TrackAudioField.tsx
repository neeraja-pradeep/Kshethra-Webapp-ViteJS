import type { ChangeEvent } from 'react'

import { Icon } from '@/shared/ui'

import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'

interface TrackAudioFieldProps {
  audioName: string
  editable: boolean
  hasError: boolean
  /** The server's own words when it rejected the file — format, size, missing. */
  errorMessage?: string
  onUpload: (file: File) => void
}

/** Audio upload/replace control + the attached-file chip; required, validated on save. */
export function TrackAudioField({ audioName, editable, hasError, errorMessage, onUpload }: TrackAudioFieldProps) {
  const hasAudio = audioName.trim().length > 0

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel editable={editable}>
        Audio file {editable && <span className="text-danger">*</span>}
      </FieldLabel>
      <div className="flex flex-wrap items-center gap-2.5">
        {editable && (
          <label className="inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-md bg-card px-3.5 text-sm font-medium text-ink shadow-xs hover:bg-hover">
            <input type="file" accept=".mp3,.wav,.ogg,.m4a,.flac,audio/*" onChange={handleChange} className="hidden" />
            <Icon name="upload-simple" size={16} />
            {hasAudio ? 'Replace file' : 'Upload audio'}
          </label>
        )}
        {hasAudio && (
          <span className="inline-flex items-center gap-1.75 rounded-md bg-success-surface px-2.75 py-1.5 text-xs text-success-strong">
            <Icon name="waveform" size={14} className="text-success" />
            {audioName}
          </span>
        )}
      </div>
      {hasError && (
        <span className="text-xs text-danger">{errorMessage ?? 'Attach an audio file.'}</span>
      )}
      {/* All five formats the API accepts. The size is the proxy's limit, not
          the API's documented 50 MB — see AUDIO_MAX_BYTES. */}
      <FieldHint editable={editable}>.mp3, .wav, .ogg, .m4a or .flac, up to 20 MB.</FieldHint>
    </div>
  )
}
