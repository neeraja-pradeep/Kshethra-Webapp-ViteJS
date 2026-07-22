import type { KeyboardEvent } from 'react'

import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

interface SortableColumnHeaderProps {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onSort: () => void
}

/** Clickable table column header with a sort-direction indicator glyph. */
export function SortableColumnHeader({ label, active, direction, onSort }: SortableColumnHeaderProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onSort()
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onSort}
      onKeyDown={handleKeyDown}
      title={`Sort by ${label}`}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon
        name={active ? (direction === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'}
        size={11}
        className={cn(active ? 'opacity-90' : 'opacity-30')}
      />
    </span>
  )
}
