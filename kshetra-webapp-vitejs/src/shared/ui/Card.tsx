import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  padding?: number
  interactive?: boolean
  overline?: boolean
  className?: string
  style?: CSSProperties
}

/** White, borderless surface lifted by soft shadow. Optional header/footer. */
export function Card({ title, subtitle, actions, footer, children, padding = 16, interactive = false, overline = false, className, style }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card font-sans shadow-card transition-shadow duration-140 ease-ks box-border',
        interactive ? 'cursor-pointer hover:shadow-card-hover' : 'cursor-default',
        className,
      )}
      style={style}
    >
      {(title || actions) && (
        <div className={cn('flex gap-3', overline ? 'items-center' : 'items-start')} style={{ padding: `${padding}px ${padding}px 0` }}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title && overline && (
              <span className="text-2xs font-semibold uppercase tracking-overline-lg text-ink-muted">
                {title}
                {subtitle && <span className="ml-1.75 font-medium normal-case tracking-normal text-ink-subtle">· {subtitle}</span>}
              </span>
            )}
            {title && !overline && <span className="text-lg font-semibold text-ink-strong">{title}</span>}
            {subtitle && !overline && <span className="text-sm text-ink-subtle">{subtitle}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {children != null && <div style={{ padding }}>{children}</div>}
      {footer && (
        <div className="border-t border-gray-100 bg-sunken" style={{ padding: `12px ${padding}px` }}>
          {footer}
        </div>
      )}
    </div>
  )
}
