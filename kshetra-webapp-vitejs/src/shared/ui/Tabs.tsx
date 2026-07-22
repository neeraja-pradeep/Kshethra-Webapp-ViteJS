import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface TabItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  value?: string
  onChange?: (id: string) => void
  variant?: 'underline' | 'pill'
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
}

/** Tab strip — underline (default) or pill segmented control. */
export function Tabs({ items, value, onChange, variant = 'underline', size = 'md', className, style }: TabsProps) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
  const font = size === 'sm' ? 'text-sm' : 'text-base'

  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex gap-0.5 rounded-xl bg-gray-100 p-0.75 font-sans', className)} style={style}>
        {items.map((it) => {
          const active = it.id === value
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange?.(it.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border-none font-medium transition-all duration-120 ease-ks cursor-pointer [font-family:inherit]',
                pad,
                font,
                active ? 'bg-card text-ink-strong shadow-xs' : 'bg-transparent text-ink-subtle',
              )}
            >
              {it.icon}
              {it.label}
              {it.badge}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-stroke font-sans', className)} style={style}>
      {items.map((it) => {
        const active = it.id === value
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(it.id)}
            className={cn(
              '-mb-px inline-flex items-center gap-1.5 border-none bg-transparent transition-[color] duration-120 ease-ks cursor-pointer [font-family:inherit]',
              pad,
              font,
              active ? 'font-semibold text-primary shadow-[inset_0_-2px_0_0_var(--color-primary)]' : 'font-medium text-ink-subtle',
            )}
          >
            {it.icon}
            {it.label}
            {it.badge}
          </button>
        )
      })}
    </div>
  )
}
