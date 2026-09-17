import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon, Spinner } from '@/shared/ui'

import { ACCEPT_ATTRIBUTE } from '@/features/tech-support/domain/entities/attachment-upload'

import type { TicketAttachment } from '@/features/tech-support/domain/entities/support-ticket'
import {
  formatBytes,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
} from '@/features/tech-support/presentation/lib/supportDisplay'

interface AttachmentFieldProps {
  attachments: TicketAttachment[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  /** Rejection text from the parent's own guard (too large, wrong type). */
  error?: string | null
  disabled?: boolean
}

/**
 * Optional screenshots for a report — drop target, then a thumbnail strip.
 *
 * Screenshots are the single thing that turns "the report is wrong" into a
 * fixable ticket, so the target is large and labelled optional rather than
 * tucked behind a paperclip: an attachment nobody notices is one nobody sends.
 */
export function AttachmentField({ attachments, onAdd, onRemove, error, disabled = false }: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const full = attachments.length >= MAX_ATTACHMENTS
  const locked = disabled || full

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onAdd(files)
    // Clearing lets the same file be picked again after a removal.
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (locked) return
    // Pass everything through; the parent applies §6's type rules and reports
    // a rejection by name. Filtering here would drop a file silently.
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onAdd(files)
  }

  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">
          Screenshots <span className="font-normal text-ink-subtle">— optional</span>
        </label>
        <span className="text-2xs font-medium text-ink-subtle">
          {attachments.length} of {MAX_ATTACHMENTS}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!locked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !locked && inputRef.current?.click()}
        role="button"
        tabIndex={locked ? -1 : 0}
        onKeyDown={(e) => {
          if (locked) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center transition-[background,border-color] duration-120 ease-ks',
          locked
            ? 'cursor-not-allowed border-stroke bg-sunken opacity-60'
            : 'cursor-pointer border-stroke-strong bg-sunken hover:bg-hover',
          dragging && !locked && 'border-primary bg-primary-subtle',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple
          disabled={locked}
          onChange={handleChange}
          // Driven entirely through the ref — `hidden` keeps it out of layout
          // rather than parking a zero-sized absolute box on some ancestor.
          hidden
        />
        <Icon name="image" size={22} className="text-ink-subtle" />
        <span className="text-sm font-medium text-ink-strong">
          {full ? `Limit of ${MAX_ATTACHMENTS} images reached` : 'Drop an image, or click to browse'}
        </span>
        <span className="text-2xs text-ink-subtle">
          PNG, JPG, GIF, WebP, PDF or XLSX, up to {formatBytes(MAX_ATTACHMENT_BYTES)} each. A screenshot of
          the error helps most.
        </span>
      </div>

      {error && <span className="text-2xs font-medium text-danger">{error}</span>}

      {attachments.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <figure key={file.id} className="m-0 flex w-20 flex-col gap-1">
              <div
                className="relative h-20 w-20 overflow-hidden rounded-lg bg-sunken"
                style={{ boxShadow: 'inset 0 0 0 1px var(--border-default)' }}
              >
                {/* Only images preview; a PDF or spreadsheet gets a glyph. */}
                {file.file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="block h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-subtle">
                    <Icon name="file" size={24} />
                  </span>
                )}

                {file.status === 'uploading' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-overlay">
                    <Spinner size={18} color="#fff" />
                  </span>
                )}
                {file.status === 'failed' && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white"
                    // `bg-danger/80` would not resolve: the token is a CSS
                    // variable, which Tailwind's opacity modifier cannot mix.
                    style={{ background: 'color-mix(in srgb, var(--color-danger) 80%, transparent)' }}
                    title={file.error}
                  >
                    <Icon name="warning" size={18} weight="fill" />
                  </span>
                )}

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemove(file.id)}
                    aria-label={`Remove ${file.name}`}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-none bg-overlay text-white"
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>
              <figcaption
                className={cn('truncate text-2xs', file.status === 'failed' ? 'text-danger' : 'text-ink-subtle')}
                title={file.status === 'failed' ? file.error : file.name}
              >
                {file.status === 'failed' ? 'Failed' : formatBytes(file.size)}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
