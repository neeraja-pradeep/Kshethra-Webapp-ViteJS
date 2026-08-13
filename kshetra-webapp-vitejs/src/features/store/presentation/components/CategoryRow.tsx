import type { DragEvent } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon, Switch } from '@/shared/ui'

import { categoryStatusLabel, type Category } from '@/features/store/domain/entities/category'

export interface CategoryRowProps {
  category: Category
  isDragSource: boolean
  isDragOver: boolean
  /** Dragging is locked while a reorder is in flight — see the screen. */
  disabled: boolean
  canEdit: boolean
  onDragStart: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: () => void
  onDragEnd: () => void
  onToggleStatus: () => void
  onEdit: () => void
}

/** One draggable, reorderable row in the categories list. */
export function CategoryRow({
  category,
  isDragSource,
  isDragOver,
  disabled,
  canEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleStatus,
  onEdit,
}: CategoryRowProps) {
  const active = category.status === 'active'

  return (
    <div
      draggable={canEdit && !disabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-3.5 border-b border-stroke-subtle px-4.5 py-3.25 transition-colors duration-120 ease-ks',
        isDragOver && !isDragSource ? 'bg-active' : isDragSource ? 'bg-hover' : 'bg-transparent',
      )}
    >
      <span
        className={cn(
          'inline-flex w-5.5 flex-shrink-0 items-center justify-center text-ink-disabled',
          canEdit && !disabled ? 'cursor-grab' : 'cursor-not-allowed opacity-50',
        )}
        title={canEdit ? 'Drag to reorder' : 'You cannot reorder categories'}
      >
        <Icon name="dots-six-vertical" size={17} />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {category.mediaUrl ? (
          <span
            className="h-8 w-8 flex-shrink-0 rounded-md bg-cover bg-center shadow-xs"
            style={{ backgroundImage: `url(${category.mediaUrl})` }}
            role="presentation"
          />
        ) : (
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-text">
            <Icon name="tag" size={15} />
          </span>
        )}
        <span className="min-w-0 truncate whitespace-nowrap text-sm font-medium text-ink-strong">{category.name}</span>
        {/* The prefix every SKU in this category is issued under. */}
        {category.skuPrefix && (
          <span className="flex-shrink-0 rounded bg-sunken px-1.5 py-0.5 font-mono text-2xs text-ink-subtle">
            {category.skuPrefix}
          </span>
        )}
      </div>

      <span className="w-24 flex-shrink-0 text-right tabular-nums text-sm text-ink">{category.productCount}</span>
      <span className="w-[90px] flex-shrink-0 text-center tabular-nums text-sm text-ink-muted">{category.sortOrder}</span>

      <span className="flex w-28 flex-shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Switch checked={active} size="sm" disabled={!canEdit} onChange={onToggleStatus} />
        <span className={cn('text-xs', active ? 'text-success' : 'text-ink-subtle')}>
          {categoryStatusLabel(category.status)}
        </span>
      </span>

      <span className="flex w-9 flex-shrink-0 justify-end">
        <button
          type="button"
          aria-label="Edit category"
          onClick={onEdit}
          className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-hover hover:text-primary"
        >
          <Icon name="pencil-simple" size={15} />
        </button>
      </span>
    </div>
  )
}
