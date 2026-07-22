import type { ReactNode } from 'react'

import { Icon } from '@/shared/ui'

export interface DetailTopBarProps {
  /** Breadcrumb root, e.g. "Store · Orders". */
  section: string
  title: ReactNode
  onBack: () => void
  /** Status pills/badges shown right of the breadcrumb (before actions). */
  badges?: ReactNode
  /** Trailing action buttons. */
  actions?: ReactNode
}

/** Full-screen detail overlay header: back button, breadcrumb, badges, actions. */
export function DetailTopBar({ section, title, onBack, badges, actions }: DetailTopBarProps) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-stroke bg-card px-6">
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="inline-flex h-8.5 w-8.5 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="arrow-left" size={18} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-overline text-ink-subtle">{section}</span>
        <span className="text-stroke-strong">/</span>
        <span className="whitespace-nowrap text-base font-semibold text-ink-strong">{title}</span>
      </div>
      {badges}
      {actions}
    </div>
  )
}
