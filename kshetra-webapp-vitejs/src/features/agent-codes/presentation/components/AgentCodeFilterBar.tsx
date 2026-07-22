import type { ChangeEvent } from 'react'

import { Icon, Input, Select } from '@/shared/ui'

import type { AgentCodeStatus, AgentCodeValidityState } from '@/features/agent-codes/domain/entities/agent-code'

export type AgentCodeStatusFilter = 'all' | AgentCodeStatus
export type AgentCodeValidityFilter = 'any' | AgentCodeValidityState

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

const VALIDITY_OPTIONS = [
  { value: 'any', label: 'All validity' },
  { value: 'active', label: 'Active now' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
]

export interface AgentCodeFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: AgentCodeStatusFilter
  onStatusChange: (value: AgentCodeStatusFilter) => void
  validity: AgentCodeValidityFilter
  onValidityChange: (value: AgentCodeValidityFilter) => void
}

/** Search box + status/validity filter selects above the KPI band. */
export function AgentCodeFilterBar({ search, onSearchChange, status, onStatusChange, validity, onValidityChange }: AgentCodeFilterBarProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
      <div className="w-[280px] max-w-full">
        <Input
          size="sm"
          placeholder="Search code or description…"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
          containerStyle={{ width: '100%' }}
        />
      </div>
      <div className="w-40">
        <Select
          size="sm"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onStatusChange(e.target.value as AgentCodeStatusFilter)}
        />
      </div>
      <div className="w-40">
        <Select
          size="sm"
          options={VALIDITY_OPTIONS}
          value={validity}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onValidityChange(e.target.value as AgentCodeValidityFilter)}
        />
      </div>
    </div>
  )
}
