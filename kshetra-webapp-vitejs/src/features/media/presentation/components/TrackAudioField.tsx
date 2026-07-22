import type { ChangeEvent } from 'react'

import { Icon } from '@/shared/ui'

import { FieldHint } from './FieldHint'
import { FieldLabel } from './FieldLabel'

interface TrackAudioFieldProps {
  audioName: string
  editable: boolean
  hasError: boolean
  onUpload: (file: File) => void
}

/** Audio upload/replace control + the attached-file chip; required, validated on save. */
export function TrackAudioField({ audioName, editable, hasError, onUpload }: TrackAudioFieldProps) {
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
            <input type="file" accept=".mp3,.wav,audio/*" onChange={handleChange} className="hidden" />
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
      {hasError && <span className="text-xs text-danger">Attach an audio file (.mp3 or .wav).</span>}
      <FieldHint editable={editable}>.mp3 or .wav, up to 20 MB.</FieldHint>
    </div>
  )
}
