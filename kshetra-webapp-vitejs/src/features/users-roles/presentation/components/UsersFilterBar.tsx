import { Icon, Input, Select, type SelectOption } from '@/shared/ui'

export interface UsersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  roleOptions: readonly SelectOption[]
  filterRole: string
  onFilterRoleChange: (value: string) => void
  statusOptions: readonly SelectOption[]
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  resultLabel: string
}

/** Search + role/status filters + right-aligned result count, above the KPI band. */
export function UsersFilterBar({
  search,
  onSearchChange,
  roleOptions,
  filterRole,
  onFilterRoleChange,
  statusOptions,
  filterStatus,
  onFilterStatusChange,
  resultLabel,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
      <div className="w-[300px] max-w-full">
        <Input
          size="sm"
          placeholder="Search name, email, phone, role…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>
      <div className="w-[180px] max-w-full">
        <Select size="sm" options={roleOptions as SelectOption[]} value={filterRole} onChange={(e) => onFilterRoleChange(e.target.value)} />
      </div>
      <div className="w-[150px] max-w-full">
        <Select size="sm" options={statusOptions as SelectOption[]} value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value)} />
      </div>
      <div className="flex-1" />
      <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">{resultLabel}</span>
    </div>
  )
}
