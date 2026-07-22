import { Icon } from '@/shared/ui'

export interface BookingSortHeaderProps<K extends string> {
  label: string
  sortKey: K
  activeSortKey: K | ''
  sortDir: 'asc' | 'desc'
  onSort: (key: K) => void
}

/** Clickable table column header showing an up/down/neutral sort glyph. */
export function BookingSortHeader<K extends string>({ label, sortKey, activeSortKey, sortDir, onSort }: BookingSortHeaderProps<K>) {
  const active = activeSortKey === sortKey
  const iconName = active ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Sort by ${label}`}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort(sortKey)
        }
      }}
      className="inline-flex cursor-pointer select-none items-center gap-1"
    >
      {label}
      <Icon name={iconName} size={11} style={{ opacity: active ? 0.9 : 0.32 }} />
    </span>
  )
}
