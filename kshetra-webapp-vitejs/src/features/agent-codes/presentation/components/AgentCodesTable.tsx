import type { ReactNode } from 'react'

import { Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { AgentCodeStatus } from '@/features/agent-codes/domain/entities/agent-code'
import { AgentCodeSortHeader } from './AgentCodeSortHeader'
import { AgentCodeStatusCell } from './AgentCodeStatusCell'

/** One row of the agent-code list table — a display-ready projection of an AgentCode. */
export interface AgentCodeRow {
  readonly id: string
  readonly code: string
  readonly description: string
  readonly validity: string
  readonly uses: string
  readonly orderValue: number
  readonly status: AgentCodeStatus
}

export type AgentCodeSortKey = 'code' | 'description' | 'validity' | 'uses' | 'orderValue' | 'status'

export interface AgentCodesTableProps {
  rows: AgentCodeRow[]
  sortKey: AgentCodeSortKey | ''
  sortDir: 'asc' | 'desc'
  onSort: (key: AgentCodeSortKey) => void
  onRowClick: (row: AgentCodeRow) => void
  onToggleStatus: (id: string) => void
  empty: ReactNode
}

/** Agent-code list table: sortable columns, mono code, right-aligned numerics. */
export function AgentCodesTable({ rows, sortKey, sortDir, onSort, onRowClick, onToggleStatus, empty }: AgentCodesTableProps) {
  const header = (label: string, key: AgentCodeSortKey) => (
    <AgentCodeSortHeader label={label} active={sortKey === key} direction={sortDir} onSort={() => onSort(key)} />
  )

  const columns: TableColumn<AgentCodeRow>[] = [
    {
      key: 'code',
      header: header('Code', 'code'),
      render: (value) => <span className="font-mono font-semibold tracking-wide text-ink-strong">{value as string}</span>,
    },
    {
      key: 'description',
      header: header('Description', 'description'),
      render: (value) => (
        <span className="inline-block max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap text-ink-muted">{value as string}</span>
      ),
    },
    {
      key: 'validity',
      header: header('Validity', 'validity'),
      render: (value) => <span className="whitespace-nowrap text-ink-muted">{value as string}</span>,
    },
    {
      key: 'uses',
      header: header('Uses', 'uses'),
      align: 'right',
      render: (value) => <span className="tabular-nums text-ink">{value as string}</span>,
    },
    {
      key: 'orderValue',
      header: header('Order value', 'orderValue'),
      align: 'right',
      render: (value) => <span className="tabular-nums text-ink">{formatINR(value as number)}</span>,
    },
    {
      key: 'status',
      header: header('Status', 'status'),
      render: (_value, row) => <AgentCodeStatusCell status={row.status} onToggle={() => onToggleStatus(row.id)} />,
    },
  ]

  return <Table columns={columns} rows={rows} onRowClick={onRowClick} empty={empty} />
}
