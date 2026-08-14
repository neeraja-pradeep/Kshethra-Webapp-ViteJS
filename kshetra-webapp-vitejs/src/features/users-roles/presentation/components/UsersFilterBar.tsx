import { Icon, Input, Select, type SelectOption } from '@/shared/ui'

export interface UsersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  roleOptions: readonly SelectOption[]
  filterRole: string
  onFilterRoleChange: (value: string) => void
  baseRoleOptions: readonly SelectOption[]
  filterBaseRole: string
  onFilterBaseRoleChange: (value: string) => void
  resultLabel: string
}

/**
 * Search + role/base-role filters + right-aligned result count.
 *
 * Every control here maps to a query parameter the server actually honours.
 * The design's status filter is absent because `rbac/users/` ignores
 * `is_active` — a status control would silently filter one page of results.
 */
export function UsersFilterBar({
  search,
  onSearchChange,
  roleOptions,
  filterRole,
  onFilterRoleChange,
  baseRoleOptions,
  filterBaseRole,
  onFilterBaseRoleChange,
  resultLabel,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
      <div className="w-[300px] max-w-full">
        <Input
          size="sm"
          placeholder="Search username, email, phone…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>
      <div className="w-[180px] max-w-full">
        <Select size="sm" options={roleOptions as SelectOption[]} value={filterRole} onChange={(e) => onFilterRoleChange(e.target.value)} />
      </div>
      <div className="w-[150px] max-w-full">
        <Select size="sm" options={baseRoleOptions as SelectOption[]} value={filterBaseRole} onChange={(e) => onFilterBaseRoleChange(e.target.value)} />
      </div>
      <div className="flex-1" />
      <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">{resultLabel}</span>
    </div>
  )
}
