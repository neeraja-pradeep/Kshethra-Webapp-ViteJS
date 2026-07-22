import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type CellSize = 'sm' | 'md'

export interface CellProps {
  prefix?: ReactNode
  title?: ReactNode
  description?: ReactNode
  suffix?: ReactNode
  meta?: ReactNode
  size?: CellSize
  interactive?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

/** Compact list row — leading media, title/description, trailing meta/suffix. */
export function Cell({ prefix, title, description, suffix, meta, size = 'md', interactive = false, selected = false, onClick, className, style }: CellProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'box-border flex items-center gap-2.5 rounded-lg font-sans transition-[background] duration-120 ease-ks',
        size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
        selected ? 'bg-primary-subtle' : interactive && 'hover:bg-hover',
        interactive ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={style}
    >
      {prefix && <span className="inline-flex shrink-0 items-center text-ink-subtle">{prefix}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        {title && <span className={cn('truncate font-medium text-ink-strong', size === 'sm' ? 'text-sm' : 'text-base')}>{title}</span>}
        {description && <span className="truncate text-xs text-ink-subtle">{description}</span>}
      </div>
      {meta && <span className="shrink-0 text-2xs font-medium tabular-nums text-ink-subtle">{meta}</span>}
      {suffix && <span className="inline-flex shrink-0 items-center gap-1.5">{suffix}</span>}
    </div>
  )
}
