import { Icon, Input, Select } from '@/shared/ui'

import type { DevoteeStatusFilter } from '@/features/devotees/presentation/lib/filterSort'

const STATUS_OPTIONS: { value: DevoteeStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
]

export interface DevoteesFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: DevoteeStatusFilter
  onStatusChange: (value: DevoteeStatusFilter) => void
}

/** Search + status filter row above the KPI band. */
export function DevoteesFilterBar({ search, onSearchChange, status, onStatusChange }: DevoteesFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3.5">
      <div className="w-[280px] max-w-full">
        <Input
          size="sm"
          placeholder="Search name, phone, email, family…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
          containerStyle={{ width: '100%' }}
        />
      </div>
      <div className="w-[170px]">
        <Select
          size="sm"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as DevoteeStatusFilter)}
          containerStyle={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
