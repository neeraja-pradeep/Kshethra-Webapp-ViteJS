import { Button, Icon } from '@/shared/ui'

export type TrackFormMode = 'view' | 'edit'

interface TrackFormHeaderProps {
  mode: TrackFormMode
  title: string
  onBack: () => void
  onStartEdit: () => void
  onCancel: () => void
  onSave: () => void
}

/** Full-screen form top bar: back, breadcrumb + track title, and mode-dependent actions. */
export function TrackFormHeader({ mode, title, onBack, onStartEdit, onCancel, onSave }: TrackFormHeaderProps) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="arrow-left" size={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-overline text-ink-subtle">App · Media</span>
        <span className="text-stroke-strong">/</span>
        <span className="whitespace-nowrap text-base font-semibold text-ink-strong">{title}</span>
      </div>

      {mode === 'view' && (
        <span
          className="inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 text-xs font-medium text-ink-muted"
          style={{ boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}
        >
          <Icon name="eye" size={13} />
          View only
        </span>
      )}
      {mode === 'view' && (
        <Button theme="primary" iconLeft={<Icon name="pencil-simple" size={15} />} onClick={onStartEdit}>
          Edit
        </Button>
      )}
      {mode === 'edit' && (
        <>
          <Button theme="default" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="primary" iconLeft={<Icon name="check" size={16} />} onClick={onSave}>
            Save track
          </Button>
        </>
      )}
    </div>
  )
}
