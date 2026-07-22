import { Button, Icon } from '@/shared/ui'

import type { UnavailableRange } from '../../domain/entities/pooja'
import { humanDate } from '../lib/dateUtils'

export interface UnavailableDatesEditorProps {
  ranges: readonly UnavailableRange[]
  start: string
  end: string
  editing: boolean
  error?: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/** Blocked dates/ranges that override the recurring schedule and specific dates. Drops out entirely in view mode when empty. */
export function UnavailableDatesEditor({ ranges, start, end, editing, error, onStartChange, onEndChange, onAdd, onRemove }: UnavailableDatesEditorProps) {
  if (!editing && ranges.length === 0) return null

  return (
    <div className="flex flex-col gap-2.75 rounded-2xl bg-card p-5.5 shadow-sm">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Unavailable dates</div>
        <div className="mt-1 text-2xs leading-snug text-ink-subtle">
          Block dates or ranges when this pooja can’t be performed. These override the recurring schedule and specific dates, and grey out on the booking calendar.
        </div>
      </div>

      {editing && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Unavailable from"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
          />
          <span className="text-ink-subtle">→</span>
          <input
            type="date"
            aria-label="Unavailable until (optional)"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="h-8.5 rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
          />
          <Button theme="default" variant="outline" size="sm" onClick={onAdd} iconLeft={<Icon name="prohibit" size={14} />}>
            Block
          </Button>
        </div>
      )}
      {editing && <div className="text-2xs text-ink-subtle">Leave the second date empty to block a single day.</div>}
      {error && <div className="text-xs text-danger">{error}</div>}

      {ranges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ranges.map((u, i) => (
            <span key={`${u.start}-${u.end}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-danger-surface py-1 pl-2.75 pr-1.25">
              <Icon name="prohibit" size={13} className="shrink-0 text-danger" />
              <span className="whitespace-nowrap text-sm font-medium text-ink">{u.start === u.end ? humanDate(u.start) : `${humanDate(u.start)} → ${humanDate(u.end)}`}</span>
              {editing && (
                <button
                  type="button"
                  aria-label="Remove blackout"
                  onClick={() => onRemove(i)}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-none bg-transparent text-ink-subtle hover:bg-sunken hover:text-danger"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
