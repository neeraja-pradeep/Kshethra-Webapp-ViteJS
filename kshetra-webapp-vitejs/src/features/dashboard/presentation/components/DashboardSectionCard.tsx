import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface DashboardSectionCardProps {
  /** Overline label, e.g. "Pooja bookings". */
  title: string
  /** Optional trailing caption, e.g. "online + counter combined". */
  caption?: string
  /** Right-aligned link label, e.g. "View bookings". */
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
  className?: string
  /** Vertical gap between the header row and body content. Default 14px. */
  gap?: '3' | '3.5'
}

/**
 * The dashboard's white section card: overline header (label + optional
 * caption + right-aligned link) above free-form content. Every dashboard
 * card shares this shell.
 */
export function DashboardSectionCard({ title, caption, actionLabel, onAction, children, className, gap = '3.5' }: DashboardSectionCardProps) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-2xl bg-card px-5 py-4.5 shadow-sm', gap === '3' ? 'gap-3' : 'gap-3.5', className)}>
      <div className="flex items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{title}</span>
        {caption && <span className="text-2xs text-ink-subtle">· {caption}</span>}
        <div className="flex-1" />
        {actionLabel && (
          <button type="button" onClick={onAction} className="border-none bg-transparent p-0 font-sans text-xs font-medium text-primary">
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
