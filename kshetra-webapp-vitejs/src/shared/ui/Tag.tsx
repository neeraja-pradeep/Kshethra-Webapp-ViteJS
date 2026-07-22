import type { CSSProperties, MouseEvent, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type TagSize = 'sm' | 'md'

export interface TagProps {
  children?: ReactNode
  size?: TagSize
  icon?: ReactNode
  onRemove?: (e: MouseEvent) => void
  active?: boolean
  onClick?: (e: MouseEvent) => void
  className?: string
  style?: CSSProperties
}

const SIZE: Record<TagSize, string> = {
  sm: 'h-5.5 px-2 text-xs gap-1.25',
  md: 'h-6.5 px-2.5 text-sm gap-1.5',
}

/** Rounded chip — filter pills, selected items, removable tokens. */
export function Tag({ children, size = 'md', icon, onRemove, active = false, onClick, className, style }: TagProps) {
  const clickable = !!onClick
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-md border leading-none whitespace-nowrap box-border transition-[background] duration-120 ease-ks',
        SIZE[size],
        active
          ? 'bg-primary-subtle text-primary-subtle-text border-primary-border'
          : cn('bg-gray-100 text-ink border-transparent', clickable && 'hover:bg-hover'),
        clickable ? 'cursor-pointer' : 'cursor-default',
        'font-medium',
        className,
      )}
      style={style}
    >
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(e)
          }}
          className="-mr-0.5 inline-flex h-4 w-4 items-center justify-center rounded-xs border-none bg-transparent p-0 leading-none text-ink-subtle cursor-pointer hover:text-ink"
        >
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  )
}
