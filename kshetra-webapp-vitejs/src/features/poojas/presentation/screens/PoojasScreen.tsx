import { useMemo, useState } from 'react'

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/core/config/app'
import { cn } from '@/shared/lib/cn'
import { formatCount, formatINR } from '@/shared/lib/format'
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  Input,
  KpiTile,
  Select,
  Switch,
  Table,
  type TableColumn,
} from '@/shared/ui'

import type { Pooja, PoojaStatus } from '../../domain/entities/pooja'
import { GODS } from '../data/gods.mock'
import { POOJAS } from '../data/poojas.mock'

type SortKey = 'name' | 'offlinePrice' | 'onlinePrice' | 'incentive' | 'status'
type SortDir = 'asc' | 'desc'

const GOD_FILTER_OPTIONS = [
  { value: 'all', label: 'All gods' },
  ...GODS.slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => ({ value: g.id, label: g.name + (g.status === 'Active' ? '' : ' (inactive)') })),
]
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]
const SPECIAL_FILTER_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'special', label: 'Special poojas' },
  { value: 'normal', label: 'Standard poojas' },
]
const INCENTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'All incentives' },
  { value: 'with', label: 'Incentive active' },
  { value: 'without', label: 'No incentive' },
]
const PAGE_SIZE_SELECT = PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))

/** Poojas master list — pricing, special-pooja setup, bulk actions. */
export function PoojasScreen() {
  const [poojas, setPoojas] = useState<Pooja[]>(POOJAS)
  const [search, setSearch] = useState('')
  const [filterGod, setFilterGod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSpecial, setFilterSpecial] = useState('all')
  const [filterIncentive, setFilterIncentive] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const filtersActive =
    !!search || filterGod !== 'all' || filterStatus !== 'all' || filterSpecial !== 'all' || filterIncentive !== 'all'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = poojas.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.godNames.join(' ')} ${p.id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterGod !== 'all' && !p.godIds.includes(filterGod)) return false
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterSpecial === 'special' && !p.special) return false
      if (filterSpecial === 'normal' && p.special) return false
      if (filterIncentive === 'with' && !p.incentive) return false
      if (filterIncentive === 'without' && p.incentive) return false
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name' || sortKey === 'status') cmp = String(a[sortKey]).localeCompare(String(b[sortKey]))
      else cmp = (Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)
      return cmp * dir
    })
  }, [poojas, search, filterGod, filterStatus, filterSpecial, filterIncentive, sortKey, sortDir])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageI = Math.min(page, pages - 1)
  const pageRows = filtered.slice(pageI * pageSize, pageI * pageSize + pageSize)
  const pageStart = total === 0 ? 0 : pageI * pageSize + 1
  const pageEnd = Math.min(total, pageI * pageSize + pageSize)

  const counts = useMemo(() => {
    const c = { Active: 0, Inactive: 0, Special: 0 }
    filtered.forEach((p) => {
      c[p.status]++
      if (p.special) c.Special++
    })
    return c
  }, [filtered])

  const selCount = Object.values(selected).filter(Boolean).length
  const allSel = pageRows.length > 0 && pageRows.every((r) => selected[r.id])
  const someSel = !allSel && pageRows.some((r) => selected[r.id])

  const resetPage = () => setPage(0)
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }
  const toggleStatus = (row: Pooja) =>
    setPoojas((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, status: (p.status === 'Active' ? 'Inactive' : 'Active') as PoojaStatus } : p)),
    )
  const bulkStatus = (status: PoojaStatus) => {
    setPoojas((prev) => prev.map((p) => (selected[p.id] ? { ...p, status } : p)))
    setSelected({})
  }
  const clearFilters = () => {
    setSearch('')
    setFilterGod('all')
    setFilterStatus('all')
    setFilterSpecial('all')
    setFilterIncentive('all')
    resetPage()
  }

  const sortHeader = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <span
      role="button"
      tabIndex={0}
      onClick={() => handleSort(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSort(key)
        }
      }}
      className={cn('inline-flex cursor-pointer select-none items-center gap-1', align === 'right' && 'flex-row-reverse')}
    >
      {label}
      <Icon
        name={sortKey === key ? (sortDir === 'desc' ? 'caret-down' : 'caret-up') : 'arrows-down-up'}
        size={11}
        className={sortKey === key ? 'opacity-90' : 'opacity-30'}
      />
    </span>
  )

  const columns: TableColumn<Pooja>[] = [
    {
      key: 'sel',
      width: 44,
      header: (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox
            checked={allSel}
            indeterminate={someSel}
            onChange={() =>
              setSelected(() => {
                if (allSel) return {}
                const next: Record<string, boolean> = {}
                pageRows.forEach((r) => (next[r.id] = true))
                return next
              })
            }
          />
        </span>
      ),
      render: (_v, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox checked={!!selected[row.id]} onChange={() => setSelected((s) => ({ ...s, [row.id]: !s[row.id] }))} />
        </span>
      ),
    },
    {
      key: 'name',
      header: sortHeader('Pooja', 'name'),
      render: (_v, row) => (
        <div className="flex min-w-0 flex-col gap-0.5 py-px">
          <span className="inline-flex min-w-0 items-center gap-1.75">
            <span className="truncate font-medium text-ink-strong">{row.name}</span>
            {row.special && (
              <Badge color="maroon" size="sm">
                Special
              </Badge>
            )}
          </span>
          <span className="text-xs text-ink-subtle">{row.godNames.join(', ')}</span>
        </div>
      ),
    },
    {
      key: 'offlinePrice',
      header: sortHeader('Offline price', 'offlinePrice', 'right'),
      align: 'right',
      render: (v) => <span className="tabular-nums">{formatINR(v as number)}</span>,
    },
    {
      key: 'onlinePrice',
      header: sortHeader('Online price', 'onlinePrice', 'right'),
      align: 'right',
      render: (v) => <span className="tabular-nums">{formatINR(v as number)}</span>,
    },
    {
      key: 'incentive',
      header: sortHeader('Incentive', 'incentive', 'right'),
      align: 'right',
      render: (v) => (
        <span className={cn('tabular-nums', Number(v) ? 'text-ink' : 'text-ink-subtle')}>
          {Number(v) ? formatINR(v as number) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: sortHeader('Status', 'status'),
      render: (_v, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2">
          <Switch checked={row.status === 'Active'} size="sm" onChange={() => toggleStatus(row)} />
          <span className={cn('min-w-[50px] text-xs', row.status === 'Active' ? 'text-success' : 'text-ink-subtle')}>
            {row.status}
          </span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 44,
      align: 'right',
      render: () => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <IconButton size="sm" label="Row actions">
            <Icon name="dots-three-vertical" size={18} />
          </IconButton>
        </span>
      ),
    },
  ]

  const emptyMsg = filtersActive ? (
    <div className="flex flex-col items-center gap-2.5 py-2">
      <span className="text-ink-subtle">No poojas match your filters.</span>
      <Button theme="default" variant="outline" size="sm" onClick={clearFilters}>
        Clear filters
      </Button>
    </div>
  ) : (
    'No poojas yet.'
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-start gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Poojas</h1>
          <p className="mt-1.5 text-sm text-ink-muted">All poojas, pricing, and special-pooja setup.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />}>
          Add pooja
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-7 pb-3.5">
        <Input
          size="sm"
          placeholder="Search pooja, god, or ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetPage()
          }}
          prefix={<Icon name="magnifying-glass" size={15} color="var(--text-subtle)" />}
          containerStyle={{ width: 280, maxWidth: '100%' }}
        />
        <Select size="sm" options={GOD_FILTER_OPTIONS} value={filterGod} onChange={(e) => { setFilterGod(e.target.value); resetPage() }} />
        <Select size="sm" options={STATUS_FILTER_OPTIONS} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage() }} />
        <Select size="sm" options={INCENTIVE_FILTER_OPTIONS} value={filterIncentive} onChange={(e) => { setFilterIncentive(e.target.value); resetPage() }} />
        <Select size="sm" options={SPECIAL_FILTER_OPTIONS} value={filterSpecial} onChange={(e) => { setFilterSpecial(e.target.value); resetPage() }} />
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(total)} {total === 1 ? 'pooja' : 'poojas'}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2.5 px-7 pb-3.5">
        <KpiTile value={formatCount(total)} label="poojas" />
        <KpiTile value={String(counts.Active)} label="Active" dot="bg-success" />
        <KpiTile value={String(counts.Inactive)} label="Inactive" dot="bg-ink-disabled" />
        <KpiTile value={String(counts.Special)} label="Special" dot="bg-primary" />
      </div>

      {selCount > 0 && (
        <div className="mx-7 mb-3 flex shrink-0 items-center gap-3 rounded-lg border border-primary-border bg-primary-subtle py-2.25 pl-3.75 pr-2.5">
          <span className="whitespace-nowrap text-sm font-semibold text-primary-subtle-text">{formatCount(selCount)} selected</span>
          <div className="h-4.5 w-px bg-primary-border" />
          <Button theme="default" variant="outline" size="sm" onClick={() => bulkStatus('Active')} iconLeft={<Icon name="check-circle" size={15} />}>
            Set active
          </Button>
          <Button theme="default" variant="outline" size="sm" onClick={() => bulkStatus('Inactive')} iconLeft={<Icon name="prohibit" size={15} />}>
            Set inactive
          </Button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSelected({})}
            className="rounded-md px-2 py-1.5 text-sm font-medium text-primary-subtle-text hover:bg-primary-subtle-hover"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table<Pooja> columns={columns} rows={pageRows} selectedId={null} empty={emptyMsg} />
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
