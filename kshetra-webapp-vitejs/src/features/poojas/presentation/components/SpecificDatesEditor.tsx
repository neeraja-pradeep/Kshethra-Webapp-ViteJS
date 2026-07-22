import { Button, Icon } from '@/shared/ui'

import type { SpecificDate } from '../../domain/entities/pooja'
import { humanDate, todayISO } from '../lib/dateUtils'

export interface SpecificDatesEditorProps {
  dates: readonly SpecificDate[]
  draft: string
  editing: boolean
  onDraftChange: (value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onFieldChange: (index: number, field: 'offlinePrice' | 'onlinePrice' | 'incentive', value: string) => void
  onOpenHistory: () => void
}

/** One-off dates & their pricing. Only upcoming dates are listed; a pill opens the past-dates history modal. */
export function SpecificDatesEditor({ dates, draft, editing, onDraftChange, onAdd, onRemove, onFieldChange, onOpenHistory }: SpecificDatesEditorProps) {
  const today = todayISO()
  const upcoming = dates
    .map((d, index) => ({ ...d, index }))
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastCount = dates.filter((d) => d.date < today).length
  const hasAnyDates = dates.length > 0

  // In view mode with no specific dates at all (past or upcoming), the whole section drops out.
  if (!editing && !hasAnyDates) return null

  return (
    <div className="flex flex-col gap-2.75">
      {hasAnyDates && (
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Specific dates &amp; pricing</div>
            <div className="mt-1 text-2xs leading-snug text-ink-subtle">
              Add individual dates (festivals, one-offs). Each prefills the base price — edit to override for that date. Only upcoming dates are listed.
            </div>
          </div>
          {pastCount > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              title="View past dates and their pricing"
              className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-2.75 text-xs font-medium text-ink-muted shadow-xs hover:bg-hover hover:text-ink-strong"
            >
              <Icon name="clock-counter-clockwise" size={14} />
              {pastCount} {pastCount === 1 ? 'past date' : 'past dates'}
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Specific date to add"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="h-8.5 flex-1 rounded-md border-none bg-card px-2.5 font-sans text-base text-ink shadow-xs"
          />
          <Button theme="default" variant="outline" size="sm" onClick={onAdd} iconLeft={<Icon name="plus" size={14} />}>
            Add date
          </Button>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {upcoming.map((r) => (
            <div key={r.date} className="flex flex-wrap items-center gap-2 rounded-md border border-stroke-subtle bg-sunken px-2.5 py-2">
              <span className="min-w-[84px] flex-1 text-sm text-ink">{humanDate(r.date)}</span>
              {editing ? (
                <>
                  <span className="flex items-center gap-1.25">
                    <span className="text-2xs text-ink-subtle">Offline ₹</span>
                    <input
                      type="number"
                      min={0}
                      aria-label="Offline price for this date"
                      value={r.offlinePrice}
                      onChange={(e) => onFieldChange(r.index, 'offlinePrice', e.target.value)}
                      className="h-7.5 w-16 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <span className="flex items-center gap-1.25">
                    <span className="text-2xs text-ink-subtle">Online ₹</span>
                    <input
                      type="number"
                      min={0}
                      aria-label="Online price for this date"
                      value={r.onlinePrice}
                      onChange={(e) => onFieldChange(r.index, 'onlinePrice', e.target.value)}
                      className="h-7.5 w-16 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <span className="flex items-center gap-1.25" title="Poojari incentive">
                    <span className="text-2xs text-ink-subtle">Incentive ₹</span>
                    <input
                      type="number"
                      min={0}
                      aria-label="Poojari incentive for this date"
                      value={r.incentive ?? 0}
                      onChange={(e) => onFieldChange(r.index, 'incentive', e.target.value)}
                      className="h-7.5 w-16 rounded-md border-none bg-card px-2 font-sans text-sm text-ink shadow-xs"
                    />
                  </span>
                  <button
                    type="button"
                    aria-label="Remove date"
                    onClick={() => onRemove(r.index)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-hover hover:text-danger"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-3.5 text-sm tabular-nums text-ink-strong">
                  <span>Offline ₹{r.offlinePrice.toLocaleString('en-IN')}</span>
                  <span>Online ₹{r.onlinePrice.toLocaleString('en-IN')}</span>
                  {!!r.incentive && <span>Incentive ₹{r.incentive.toLocaleString('en-IN')}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {hasAnyDates && upcoming.length === 0 && <div className="text-sm text-ink-muted">No upcoming dates.</div>}
    </div>
  )
}
