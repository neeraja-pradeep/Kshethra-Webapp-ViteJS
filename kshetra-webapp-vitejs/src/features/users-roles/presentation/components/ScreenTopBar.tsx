import type { ReactNode } from 'react'

import { Icon } from '@/shared/ui'

export interface ScreenTopBarProps {
  onBack: () => void
  crumb: string
  title: string
  right?: ReactNode
}

/** Shared 56px top bar for the detail and add/edit-form overlays: back, breadcrumb, actions. */
export function ScreenTopBar({ onBack, crumb, title, right }: ScreenTopBarProps) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="arrow-left" size={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-overline text-ink-subtle">{crumb}</span>
        <span className="text-stroke-strong">/</span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-ink-strong">{title}</span>
      </div>
      {right}
    </div>
  )
}
