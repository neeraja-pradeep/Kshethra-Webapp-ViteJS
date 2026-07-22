import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface ImageUploadTileProps {
  image: string | null
  editing: boolean
  boxClassName: string
  uploadLabel: string
  removeLabel: string
  hint?: string
  onUpload: (file: File) => void
  onRemove: () => void
}

/** Preview-or-upload tile for a single artwork slot (pooja card/banner, god home/pooja image). Drops out entirely in view mode when empty. */
export function ImageUploadTile({ image, editing, boxClassName, uploadLabel, removeLabel, hint, onUpload, onRemove }: ImageUploadTileProps) {
  if (!editing && !image) return null

  if (image) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg bg-sunken shadow-[inset_0_0_0_1px_var(--border-default)]', boxClassName)}>
        <img src={image} alt="" className="block h-full w-full object-cover" />
        {editing && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border-none bg-[rgba(20,10,12,0.6)] text-white"
          >
            <Icon name="trash" size={15} />
          </button>
        )}
      </div>
    )
  }

  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-stroke-strong bg-sunken text-ink-subtle hover:bg-hover',
        boxClassName,
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="absolute h-0 w-0 opacity-0"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <Icon name="image" size={22} />
      <span className="text-sm">{uploadLabel}</span>
      {hint && <span className="text-2xs text-ink-disabled">{hint}</span>}
    </label>
  )
}
