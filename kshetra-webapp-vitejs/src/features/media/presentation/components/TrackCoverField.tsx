import type { ChangeEvent } from 'react'

import { Icon } from '@/shared/ui'

import { FieldLabel } from './FieldLabel'

interface TrackCoverFieldProps {
  cover: string | null
  editable: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}

const BOX_SIZE = { width: 150, height: 150 }

/** 150x150 cover-art uploader: dashed drop target when empty, preview + remove once set. */
export function TrackCoverField({ cover, editable, onUpload, onRemove }: TrackCoverFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-none flex-col gap-2">
      <FieldLabel editable={editable}>Cover image</FieldLabel>

      {cover && (
        <div className="relative overflow-hidden rounded-lg bg-sunken" style={{ ...BOX_SIZE, boxShadow: 'inset 0 0 0 1px var(--border-default)' }}>
          <img src={cover} alt="Cover" className="block h-full w-full object-cover" />
          {editable && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove cover"
              className="absolute right-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-overlay text-white"
            >
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
      )}

      {!cover && editable && (
        <label
          style={BOX_SIZE}
          className="relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-stroke-strong bg-sunken text-ink-subtle hover:bg-hover"
        >
          <input type="file" accept="image/*" onChange={handleChange} className="absolute h-0 w-0 opacity-0" />
          <Icon name="music-notes" size={24} />
          <span className="text-xs">Player art</span>
        </label>
      )}
    </div>
  )
}
