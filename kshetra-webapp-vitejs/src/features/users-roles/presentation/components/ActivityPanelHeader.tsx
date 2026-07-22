import type { ReactNode } from 'react'

export interface ActivityPanelHeaderProps {
  icon: ReactNode
  title: string
  trailing?: ReactNode
}

/** Icon tile + title row shared by every role-specific activity panel on the detail screen. */
export function ActivityPanelHeader({ icon, title, trailing }: ActivityPanelHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-text">{icon}</span>
      <div className="text-base font-semibold text-ink-strong">{title}</div>
      {trailing && (
        <>
          <div className="flex-1" />
          {trailing}
        </>
      )}
    </div>
  )
}
