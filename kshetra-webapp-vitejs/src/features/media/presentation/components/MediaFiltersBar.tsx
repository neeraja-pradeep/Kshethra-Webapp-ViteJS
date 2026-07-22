import { Icon, Input, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'
import type { MediaTrackStatus } from '@/features/media/domain/entities/media-track'

export type MediaStatusFilter = 'all' | MediaTrackStatus
export type MediaHomeFilter = 'any' | 'featured' | 'not'

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

const HOME_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'All tracks' },
  { value: 'featured', label: 'On home screen' },
  { value: 'not', label: 'Not featured' },
]

interface MediaFiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: MediaStatusFilter
  onStatusChange: (value: MediaStatusFilter) => void
  home: MediaHomeFilter
  onHomeChange: (value: MediaHomeFilter) => void
}

/** Search box + status / home-screen filter selects above the KPI band. */
export function MediaFiltersBar({ search, onSearchChange, status, onStatusChange, home, onHomeChange }: MediaFiltersBarProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
      <div className="max-w-full" style={{ width: 280 }}>
        <Input
          size="sm"
          placeholder="Search title or artist…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>
      <div className="w-40">
        <Select size="sm" options={STATUS_OPTIONS} value={status} onChange={(e) => onStatusChange(e.target.value as MediaStatusFilter)} />
      </div>
      <div style={{ width: 170 }}>
        <Select size="sm" options={HOME_OPTIONS} value={home} onChange={(e) => onHomeChange(e.target.value as MediaHomeFilter)} />
      </div>
    </div>
  )
}
