import { useMemo, useState } from 'react'

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/core/config/app'
import { cn } from '@/shared/lib/cn'
import { formatCount } from '@/shared/lib/format'
import { Button, Icon, IconButton, Input, KpiTile, Select, Switch, Table, type TableColumn } from '@/shared/ui'

import type { God, GodStatus } from '../../domain/entities/god'
import { GODS } from '../data/gods.mock'
import { POOJAS } from '../data/poojas.mock'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]
const PAGE_SIZE_SELECT = PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))

/** Pooja count per god, derived from the poojas catalogue. */
const POOJA_COUNT_BY_GOD: Record<string, number> = POOJAS.reduce<Record<string, number>>((acc, p) => {
  p.godIds.forEach((id) => (acc[id] = (acc[id] ?? 0) + 1))
  return acc
}, {})

function Thumb({ src }: { src: string | null }) {
  if (src) return <img src={src} alt="" className="h-9 w-9 rounded-md object-cover" />
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-ink-disabled">
      <Icon name="image" size={16} />
    </span>
  )
}

/** Gods master data — every pooja references a god. */
export function GodsScreen() {
  const [gods, setGods] = useState<God[]>(GODS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const filtersActive = !!search || filterStatus !== 'all'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return gods
      .filter((g) => (q ? g.name.toLowerCase().includes(q) : true))
      .filter((g) => (filterStatus === 'all' ? true : g.status === filterStatus))
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [gods, search, filterStatus])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageI = Math.min(page, pages - 1)
  const pageRows = filtered.slice(pageI * pageSize, pageI * pageSize + pageSize)
  const pageStart = total === 0 ? 0 : pageI * pageSize + 1
  const pageEnd = Math.min(total, pageI * pageSize + pageSize)

  const activeCount = gods.filter((g) => g.status === 'Active').length
  const inactiveCount = gods.length - activeCount

  const resetPage = () => setPage(0)
  const toggleStatus = (row: God) =>
    setGods((prev) =>
      prev.map((g) => (g.id === row.id ? { ...g, status: (g.status === 'Active' ? 'Inactive' : 'Active') as GodStatus } : g)),
    )
  const clearFilters = () => {
    setSearch('')
    setFilterStatus('all')
    resetPage()
  }

  const columns: TableColumn<God>[] = [
    {
      key: 'handle',
      width: 40,
      header: '',
      render: () => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex cursor-grab items-center justify-center text-ink-disabled" title="Drag to reorder">
          <Icon name="dots-six-vertical" size={16} />
        </span>
      ),
    },
    { key: 'name', header: 'Name', render: (v) => <span className="font-medium text-ink-strong">{v as string}</span> },
    { key: 'homeImage', header: 'Home image', render: (v) => <Thumb src={v as string | null} /> },
    { key: 'poojaImage', header: 'Pooja image', render: (v) => <Thumb src={v as string | null} /> },
    {
      key: 'poojaCount',
      header: 'Poojas',
      align: 'right',
      render: (_v, row) => {
        const n = POOJA_COUNT_BY_GOD[row.id] ?? 0
        return n > 0 ? (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            title="View this god’s poojas"
            className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm font-medium tabular-nums text-primary"
          >
            {formatCount(n)}
            <Icon name="arrow-up-right" size={11} />
          </button>
        ) : (
          <span className="tabular-nums text-ink-disabled">0</span>
        )
      },
    },
    { key: 'sortOrder', header: 'Sort order', align: 'right', render: (v) => <span className="tabular-nums text-ink-muted">{v as number}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2">
          <Switch checked={row.status === 'Active'} size="sm" onChange={() => toggleStatus(row)} />
          <span className={cn('min-w-[50px] text-xs', row.status === 'Active' ? 'text-success' : 'text-ink-subtle')}>{row.status}</span>
        </span>
      ),
    },
  ]

  const emptyMsg = filtersActive ? (
    <div className="flex flex-col items-center gap-2.5 py-2">
      <span className="text-ink-subtle">No gods match your filters.</span>
      <Button theme="default" variant="outline" size="sm" onClick={clearFilters}>
        Clear filters
      </Button>
    </div>
  ) : (
    'No gods yet.'
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-start gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Gods</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Master data — every pooja references a god.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />}>
          Add god
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-7 pb-3.5">
        <Input
          size="sm"
          placeholder="Search gods by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetPage()
          }}
          prefix={<Icon name="magnifying-glass" size={15} color="var(--text-subtle)" />}
          containerStyle={{ width: 280, maxWidth: '100%' }}
        />
        <Select size="sm" options={STATUS_FILTER_OPTIONS} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage() }} />
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(total)} {total === 1 ? 'god' : 'gods'}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
        <KpiTile value={formatCount(gods.length)} label="gods" />
        <KpiTile value={formatCount(activeCount)} label="Active" dot="bg-success" />
        <KpiTile value={formatCount(inactiveCount)} label="Inactive" dot="bg-stroke-strong" />
      </div>

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table<God> columns={columns} rows={pageRows} selectedId={null} empty={emptyMsg} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
        <span className="text-sm text-ink-subtle">
          Showing {formatCount(pageStart)}–{formatCount(pageEnd)} of {formatCount(total)}
        </span>
        <div className="flex-1" />
        <span className="text-sm text-ink-subtle">Rows</span>
        <Select
          size="sm"
          options={PAGE_SIZE_SELECT}
          value={String(pageSize)}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            resetPage()
          }}
        />
        <div className="flex items-center gap-1">
          <IconButton size="sm" label="Previous page" disabled={pageI <= 0} className="shadow-xs" onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <Icon name="caret-left" size={15} />
          </IconButton>
          <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">
            Page {pageI + 1} of {pages}
          </span>
          <IconButton size="sm" label="Next page" disabled={pageI >= pages - 1} className="shadow-xs" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
            <Icon name="caret-right" size={15} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
