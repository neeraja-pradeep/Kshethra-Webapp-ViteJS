import { Button, Icon } from '@/shared/ui'

export interface DrawerHeaderProps {
  crumb: string
  title: string
  isView: boolean
  saveLabel: string
  onBack: () => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

/** Sticky header shared by the pooja and god detail drawers: back, breadcrumb, view/editing pill, action buttons. */
export function DrawerHeader({ crumb, title, isView, saveLabel, onBack, onEdit, onCancel, onSave }: DrawerHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="arrow-left" size={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">{crumb}</span>
        <span className="text-stroke-strong">/</span>
        <span className="truncate whitespace-nowrap text-base font-semibold text-ink-strong">{title}</span>
      </div>
      {isView ? (
        <span className="inline-flex h-6.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 text-xs font-medium text-ink-muted shadow-[inset_0_0_0_1px_var(--border-default)]">
          <Icon name="eye" size={14} />
          View only
        </span>
      ) : (
        <span className="inline-flex h-6.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-subtle px-2.75 text-xs font-semibold text-primary-subtle-text">
          <Icon name="pencil-simple" size={14} />
          Editing
        </span>
      )}
      {isView && (
        <Button theme="primary" size="sm" onClick={onEdit} iconLeft={<Icon name="pencil-simple" size={14} />}>
          Edit
        </Button>
      )}
      {!isView && (
        <>
          <Button theme="default" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button theme="primary" size="sm" onClick={onSave}>
            {saveLabel}
          </Button>
        </>
      )}
    </div>
  )
}
