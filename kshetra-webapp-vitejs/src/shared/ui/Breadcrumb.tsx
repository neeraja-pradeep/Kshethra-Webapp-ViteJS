import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface BreadcrumbItem {
  label: ReactNode
  href?: string
  icon?: ReactNode
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
}

/** Breadcrumb trail; the last item is the current page. */
export function Breadcrumb({ items, size = 'md', className, style }: BreadcrumbProps) {
  const font = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <nav aria-label="Breadcrumb" className={cn('font-sans', className)} style={style}>
      <ol className="m-0 flex list-none items-center gap-1.5 p-0">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {it.href && !last ? (
                <a href={it.href} className={cn('inline-flex items-center gap-1.25 font-medium text-ink-subtle no-underline', font)}>
                  {it.icon}
                  {it.label}
                </a>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('inline-flex items-center gap-1.25', font, last ? 'font-semibold text-ink-strong' : 'font-medium text-ink-subtle')}>
                  {it.icon}
                  {it.label}
                </span>
              )}
              {!last && (
                <svg width={14} height={14} viewBox="0 0 16 16" fill="none" className="text-ink-disabled">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
