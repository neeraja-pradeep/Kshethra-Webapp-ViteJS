import { Button, Icon, Switch } from '@/shared/ui'

import type { SpecialDateDraft } from '@/features/poojas/presentation/lib/poojaForm'

import { humanDate } from '../lib/dateUtils'

export interface SpecificDatesEditorProps {
  dates: readonly SpecialDateDraft[]
  draft: string
  editing: boolean
  error?: string
  onDraftChange: (value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onFieldChange: (index: number, patch: Partial<SpecialDateDraft>) => void
}

/**
 * The published dates a special pooja may be booked on, each with its own
 * optional time and price override.
 *
 * The list is additive on the server, so **an already-published date cannot be
 * removed from here**: dropping it from the payload leaves it standing, and a
 * remove button that silently did nothing would be worse than none. A published
 * date can have orders against it; only
 * `DELETE /booking/special-pooja-dates/<id>/` retracts one and unwinds them.
 *
 * Rows added in this session are not published yet, so those can still be
 * taken back out.
 */
export function SpecificDatesEditor({
  dates,
  draft,
  editing,
  error,
  onDraftChange,
  onAdd,
  onRemove,
  onFieldChange,
}: SpecificDatesEditorProps) {
  if (!editing && dates.length === 0) return null

  return (
    <div className="flex flex-col gap-2.75">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
          Published dates &amp; pricing
        </div>
        <div className="mt-1 text-2xs leading-snug text-ink-subtle">
          A special pooja may only be booked on a published date. Leave a price blank to use the
          pooja’s own. Only upcoming, unblocked dates are listed.
        </div>
      </div>

      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Date to publish"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="h-8.5 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
          />
          <Button
            theme="default"
            variant="outline"
            size="sm"
            onClick={onAdd}
            iconLeft={<Icon name="plus" size={14} />}
          >
            Add date
          </Button>
        </div>
      )}

      {error && <div className="text-xs text-danger">{error}</div>}

      {dates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {dates.map((row, index) => (
            <div
              key={row.id ?? `new-${row.date}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-md border border-stroke-subtle bg-sunken px-2.5 py-2"
            >
              <span className="min-w-[84px] flex-1 text-sm text-ink">{humanDate(row.date)}</span>
              {editing ? (
                <>
                  <span className="flex items-center gap-1.25">
                    <span className="text-2xs text-ink-subtle">Time</span>
                    <input
                      type="time"
                      aria-label="Time for this date"
                      value={row.time.slice(0, 5)}
                      onChange={(e) =>
                        onFieldChange(index, { time: e.target.value ? `${e.target.value}:00` : '' })
                      }
                      className="h-7.5 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <span className="flex items-center gap-1.25">
                    <span className="text-2xs text-ink-subtle">Offline ₹</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      aria-label="Offline price for this date"
                      value={row.offlinePrice}
                      onChange={(e) => onFieldChange(index, { offlinePrice: e.target.value })}
                      className="h-7.5 w-16 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <span className="flex items-center gap-1.25">
                    <span className="text-2xs text-ink-subtle">Online ₹</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      aria-label="Online price for this date"
                      value={row.onlinePrice}
                      onChange={(e) => onFieldChange(index, { onlinePrice: e.target.value })}
                      className="h-7.5 w-16 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <span
                    className="flex items-center gap-1.5"
                    title="Feature this date on the app banner"
                  >
                    <span className="text-2xs text-ink-subtle">Banner</span>
                    <Switch
                      checked={row.banner}
                      size="sm"
                      onChange={(e) => onFieldChange(index, { banner: e.target.checked })}
                    />
                  </span>
                  {row.id == null ? (
                    <button
                      type="button"
                      aria-label="Remove date"
                      onClick={() => onRemove(index)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-hover hover:text-danger"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  ) : (
                    <span
                      title="A published date can have bookings against it. Block the day instead, or remove it from Special pooja dates."
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-ink-disabled"
                    >
                      <Icon name="lock-simple" size={14} />
                    </span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-3.5 text-sm tabular-nums text-ink-strong">
                  {row.time && <span>{row.time.slice(0, 5)}</span>}
                  <span>
                    Offline{' '}
                    {row.offlinePrice
                      ? `₹${Number(row.offlinePrice).toLocaleString('en-IN')}`
                      : '—'}
                  </span>
                  <span>
                    Online{' '}
                    {row.onlinePrice ? `₹${Number(row.onlinePrice).toLocaleString('en-IN')}` : '—'}
                  </span>
                  {row.banner && <Icon name="megaphone" size={14} className="text-primary" />}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && dates.length === 0 && (
        <div className="text-sm text-ink-muted">No upcoming dates.</div>
      )}
    </div>
  )
}
