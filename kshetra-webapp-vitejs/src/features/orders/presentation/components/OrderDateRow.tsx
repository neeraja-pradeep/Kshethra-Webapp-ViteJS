import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { OrderOccurrence } from '@/features/orders/domain/entities/order'
import { deriveOccurrenceStatus, occurrenceActionMeta, occurrenceToneTextClass, type OccurrenceActionKind } from '@/features/orders/presentation/lib/occurrenceStatus'
import { formatOrderDate } from '@/features/orders/presentation/lib/format'

export interface OrderDateRowProps {
  occurrence: OrderOccurrence
  todayIso: string
  selected: boolean
  onToggleSelect: () => void
  onAction: (kind: OccurrenceActionKind) => void
}

/** One scheduled date within a pooja line item: checkbox, date/poojari, status, and its actions. */
export function OrderDateRow({ occurrence, todayIso, selected, onToggleSelect, onAction }: OrderDateRowProps) {
  const status = deriveOccurrenceStatus(occurrence, todayIso)
  const showActionRow = status.actions.length > 0 || !!status.infoText

  return (
    <div
      className={cn(
        'flex flex-col gap-2.75 rounded-lg p-3',
        status.danger ? 'bg-danger-surface shadow-[inset_0_0_0_1px_var(--color-danger-border)]' : 'bg-card shadow-[inset_0_0_0_1px_var(--border-subtle)]',
      )}
    >
      <div className="flex items-start gap-2.75">
        {status.cancellable ? (
          <button
            type="button"
            onClick={onToggleSelect}
            aria-label="Select date to cancel"
            className={cn(
              'mt-px inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm border-none p-0 text-white',
              selected ? 'bg-primary shadow-none' : 'bg-card shadow-[inset_0_0_0_1px_var(--border-strong)]',
            )}
          >
            {selected && <Icon name="check" size={12} />}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink-strong">{formatOrderDate(occurrence.date)}</span>
          <span className="inline-flex items-center gap-1.25 text-xs text-ink-subtle">
            <Icon name="user-circle" size={14} />
            {occurrence.poojari}
          </span>
        </div>
        <span className={cn('mt-px whitespace-nowrap text-sm font-semibold', occurrenceToneTextClass(status.tone))}>{status.label}</span>
      </div>

      {showActionRow && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 pl-[29px]">
          {status.infoText ? (
            <div className={cn('inline-flex min-w-[180px] flex-1 items-center gap-1.75 text-xs', occurrenceToneTextClass(status.tone))}>
              {status.infoIcon && <Icon name={status.infoIcon} weight={status.infoIconWeight} size={15} className="shrink-0" />}
              {status.infoText}
            </div>
          ) : (
            <div className="min-w-[20px] flex-1" />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {status.actions.map((kind) => {
              const meta = occurrenceActionMeta(kind)
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onAction(kind)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 font-sans text-sm font-medium hover:brightness-[0.96]',
                    meta.className,
                  )}
                >
                  <Icon name={meta.icon} size={15} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
