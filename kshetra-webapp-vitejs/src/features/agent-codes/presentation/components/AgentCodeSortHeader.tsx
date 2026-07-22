import { Icon } from '@/shared/ui'

export interface AgentCodeSortHeaderProps {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onSort: () => void
}

/** Clickable table column header showing the current sort direction. */
export function AgentCodeSortHeader({ label, active, direction, onSort }: AgentCodeSortHeaderProps) {
  const iconName = active ? (direction === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Sort by ${label}`}
      onClick={onSort}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort()
        }
      }}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={iconName} size={11} style={{ opacity: active ? 0.9 : 0.32 }} />
    </span>
  )
}
