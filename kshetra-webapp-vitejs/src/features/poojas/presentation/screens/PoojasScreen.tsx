import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE } from '@/core/config/app'
import { toFailure } from '@/core/error/result'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn } from '@/shared/lib/cn'
import { formatCount, formatINR } from '@/shared/lib/format'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  FilteredEmpty,
  Icon,
  Input,
  KpiTile,
  ListPagination,
  Select,
  Spinner,
  Switch,
  Table,
  type TableColumn,
} from '@/shared/ui'

import { useGodsQuery } from '@/features/poojas/application/queries/useGodsQuery'
import {
  useBulkDeletePoojasMutation,
  useBulkPoojaStatusMutation,
  useCreatePoojaMutation,
  useDeletePoojaMutation,
  useDuplicatePoojaMutation,
  useSetPoojaStatusMutation,
  useUpdatePoojaMutation,
} from '@/features/poojas/application/queries/usePoojaMutations'
import { usePoojasQuery } from '@/features/poojas/application/queries/usePoojasQuery'
import type { God } from '@/features/poojas/domain/entities/god'
import type { Pooja, PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type { PoojaWrite } from '@/features/poojas/domain/repositories/pooja.repository'
import {
  ALL,
  defaultPoojaListFilters,
  poojaListFiltersActive,
  toPoojaFilters,
  type PoojaListFilterState,
  type PoojaSortKey,
} from '@/features/poojas/presentation/lib/poojaFilters'

import { ConfirmModal } from '../components/ConfirmModal'
import { ImportPoojasModal } from '../components/ImportPoojasModal'
import { PoojaDetailDrawer } from '../components/PoojaDetailDrawer'
import { PoojaRowMenu } from '../components/PoojaRowMenu'
import { PoojaToast } from '../components/PoojaToast'

/** 'closed' | 'new' | an existing pooja's id — drives the detail drawer. */
type DetailTarget = 'closed' | 'new' | number

const STATUS_FILTER_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
const SPECIAL_FILTER_OPTIONS = [
  { value: ALL, label: 'All types' },
  { value: 'special', label: 'Special poojas' },
  { value: 'standard', label: 'Standard poojas' },
]
const INCENTIVE_FILTER_OPTIONS = [
  { value: ALL, label: 'All incentives' },
  { value: 'with', label: 'Incentive active' },
  { value: 'without', label: 'No incentive' },
]

const TOAST_MS = 2400
const EMPTY_SUMMARY = { total: 0, active: 0, inactive: 0, special: 0, nextSortOrder: 1 } as const
/** Frozen so the god-filter memo is not rebuilt on every render while loading. */
const NO_GODS: readonly God[] = []

/** Poojas master list — pricing, special-pooja setup, bulk actions. */
export function PoojasScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Arriving from a god's "N poojas ↗" cell pre-selects that god.
  const godParam = searchParams.get('god')

  const [filters, setFilters] = useState<PoojaListFilterState>(() => ({
    ...defaultPoojaListFilters(),
    ...(godParam ? { god: godParam } : {}),
  }))
  const debouncedSearch = useDebounce(filters.search)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const [detailTarget, setDetailTarget] = useState<DetailTarget>('closed')
  const [savedNonce, setSavedNonce] = useState(0)

  /** Opening the drawer on a different pooja must not inherit the last one's error. */
  function openDetail(target: DetailTarget) {
    createPooja.reset()
    updatePooja.reset()
    deletePooja.reset()
    setDetailTarget(target)
  }
  const [importOpen, setImportOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Pooja | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useMemo(
    () => toPoojaFilters(filters, page, pageSize, debouncedSearch.trim()),
    [filters, page, pageSize, debouncedSearch],
  )
  const poojasQuery = usePoojasQuery(query)
  // The god filter's options, and the drawer's picker, share one read.
  const godsQuery = useGodsQuery(useMemo(() => ({}), []))

  const createPooja = useCreatePoojaMutation()
  const updatePooja = useUpdatePoojaMutation()
  const setStatus = useSetPoojaStatusMutation()
  const deletePooja = useDeletePoojaMutation()
  const duplicatePooja = useDuplicatePoojaMutation()
  const bulkStatus = useBulkPoojaStatusMutation()
  const bulkDelete = useBulkDeletePoojasMutation()

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  const rows = poojasQuery.data?.results ?? []
  const count = poojasQuery.data?.count ?? 0
  const summary = poojasQuery.data?.summary ?? EMPTY_SUMMARY
  const gods = godsQuery.data?.results ?? NO_GODS
  const stale = poojasQuery.isPlaceholderData || poojasQuery.isFetching
  const filtersActive = poojaListFiltersActive(filters)
  // The row menu's Delete has nowhere else to report: it fires with no drawer
  // open, and the documented refusal for a booked pooja is the whole point of
  // the guard. It belongs in the list-level alert alongside the other
  // list-level writes.
  const listFailure =
    toFailure(poojasQuery.error) ??
    toFailure(setStatus.error) ??
    toFailure(bulkStatus.error) ??
    toFailure(bulkDelete.error) ??
    toFailure(duplicatePooja.error) ??
    (detailTarget === 'closed' ? toFailure(deletePooja.error) : null)

  const openPooja =
    typeof detailTarget === 'number' ? (rows.find((p) => p.id === detailTarget) ?? null) : null

  const godFilterOptions = useMemo(
    () => [
      { value: ALL, label: 'All gods' },
      ...gods
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((g) => ({
          value: String(g.id),
          label: g.name + (g.status === 'Active' ? '' : ' (inactive)'),
        })),
    ],
    [gods],
  )

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => Number(id)),
    [selected],
  )
  const allSelected = rows.length > 0 && rows.every((r) => selected[r.id])
  const someSelected = !allSelected && rows.some((r) => selected[r.id])

  /** Any filter change resets to page 1 — page 7 of the old result set is meaningless. */
  function updateFilters(patch: Partial<PoojaListFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
    setSelected({})
    if (patch.god !== undefined && godParam) {
      searchParams.delete('god')
      setSearchParams(searchParams, { replace: true })
    }
  }

  function clearFilters() {
    setFilters(defaultPoojaListFilters())
    setPage(1)
    setSelected({})
    if (godParam) {
      searchParams.delete('god')
      setSearchParams(searchParams, { replace: true })
    }
  }

  function handleSort(key: PoojaSortKey) {
    updateFilters({
      sortKey: key,
      sortDir: filters.sortKey === key && filters.sortDir === 'asc' ? 'desc' : 'asc',
    })
  }

  function handleSave(input: PoojaWrite) {
    // The pooja is saved either way; only the artwork step can be the half that
    // failed, and reporting "save failed" would invite a retry that
    // re-reconciles the blocks.
    const toastFor = (message: string, imageError: string | null) =>
      showToast(imageError ? `${message}, but the image could not be uploaded` : message)

    if (detailTarget === 'new') {
      createPooja.mutate(input, {
        onSuccess: (outcome) => {
          setDetailTarget('closed')
          toastFor('Pooja added', outcome.imageError)
        },
      })
      return
    }
    if (typeof detailTarget !== 'number') return
    updatePooja.mutate(
      { id: detailTarget, input },
      {
        onSuccess: (outcome) => {
          // Stay open: the drawer drops back to its view pane so the operator
          // sees the saved record rather than the list they came from.
          setSavedNonce((n) => n + 1)
          toastFor('Pooja updated', outcome.imageError)
        },
      },
    )
  }

  function handleBulkStatus(status: PoojaStatus) {
    bulkStatus.mutate(
      { ids: selectedIds, status },
      {
        onSuccess: (outcome) => {
          setSelected({})
          showToast(outcome.message)
        },
      },
    )
  }

  function handleBulkDelete() {
    bulkDelete.mutate(selectedIds, {
      onSuccess: (outcome) => {
        setSelected({})
        setConfirmBulkDelete(false)
        // It deletes what it can and names what it could not — a booked pooja
        // in a selection of twenty does not block the other nineteen.
        showToast(
          outcome.skipped.length
            ? `${outcome.message}. ${outcome.skipped.length} kept: ${outcome.skipped.map((s) => `${s.name} — ${s.reason}`).join('; ')}`
            : outcome.message,
        )
      },
    })
  }

  const sortHeader = (label: string, key: PoojaSortKey, align: 'left' | 'right' = 'left') => (
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
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-1',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      <Icon
        name={
          filters.sortKey === key
            ? filters.sortDir === 'desc'
              ? 'caret-down'
              : 'caret-up'
            : 'arrows-down-up'
        }
        size={11}
        className={filters.sortKey === key ? 'opacity-90' : 'opacity-30'}
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
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() =>
              setSelected(() => {
                if (allSelected) return {}
                const next: Record<number, boolean> = {}
                rows.forEach((r) => (next[r.id] = true))
                return next
              })
            }
          />
        </span>
      ),
      render: (_v, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox
            checked={!!selected[row.id]}
            onChange={() => setSelected((s) => ({ ...s, [row.id]: !s[row.id] }))}
          />
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
      header: sortHeader('Offline price', 'offline_price', 'right'),
      align: 'right',
      render: (v) => <span className="tabular-nums">{formatINR(v as number)}</span>,
    },
    {
      key: 'onlinePrice',
      header: sortHeader('Online price', 'online_price', 'right'),
      align: 'right',
      render: (v) => <span className="tabular-nums">{formatINR(v as number)}</span>,
    },
    {
      key: 'poojariIncentive',
      header: sortHeader('Incentive', 'poojari_incentive', 'right'),
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
          <Switch
            checked={row.status === 'Active'}
            size="sm"
            disabled={setStatus.isPending}
            onChange={() =>
              setStatus.mutate({
                id: row.id,
                status: row.status === 'Active' ? 'Inactive' : 'Active',
              })
            }
          />
          <span
            className={cn(
              'min-w-[50px] text-xs',
              row.status === 'Active' ? 'text-success' : 'text-ink-subtle',
            )}
          >
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
      render: (_v, row) => (
        <PoojaRowMenu
          disabled={duplicatePooja.isPending || deletePooja.isPending}
          onDuplicate={() =>
            duplicatePooja.mutate(
              { id: row.id },
              // The copy is created inactive: one that went live the moment it
              // was made would be a second bookable pooja under the same god.
              { onSuccess: () => showToast(`'${row.name}' duplicated. The copy is inactive.`) },
            )
          }
          onDelete={() => setPendingDelete(row)}
        />
      ),
    },
  ]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-start gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">
            Poojas
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            All poojas, pricing, and special-pooja setup.
          </p>
        </div>
        <Button
          theme="default"
          variant="outline"
          iconLeft={<Icon name="upload-simple" size={16} />}
          onClick={() => setImportOpen(true)}
        >
          Import
        </Button>
        <Button
          theme="primary"
          iconLeft={<Icon name="plus" size={16} />}
          onClick={() => openDetail('new')}
        >
          Add pooja
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-7 pb-3.5">
        <Input
          size="sm"
          placeholder="Search pooja, god, or ID…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          prefix={<Icon name="magnifying-glass" size={15} color="var(--text-subtle)" />}
          containerStyle={{ width: 280, maxWidth: '100%' }}
        />
        <Select
          size="sm"
          options={godFilterOptions}
          value={filters.god}
          onChange={(e) => updateFilters({ god: e.target.value })}
        />
        <Select
          size="sm"
          options={STATUS_FILTER_OPTIONS}
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
        />
        <Select
          size="sm"
          options={INCENTIVE_FILTER_OPTIONS}
          value={filters.incentive}
          onChange={(e) => updateFilters({ incentive: e.target.value })}
        />
        <Select
          size="sm"
          options={SPECIAL_FILTER_OPTIONS}
          value={filters.special}
          onChange={(e) => updateFilters({ special: e.target.value })}
        />
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(count)} {count === 1 ? 'pooja' : 'poojas'}
        </span>
      </div>

      {/* Tiles are counted over the filters but not over the page, so a filtered
          screen stays honest and paging never changes them. */}
      <div className={cn('flex shrink-0 flex-wrap gap-2.5 px-7 pb-3.5', stale && 'opacity-60')}>
        <KpiTile
          value={formatCount(summary.total)}
          label={summary.total === 1 ? 'pooja' : 'poojas'}
        />
        <KpiTile value={formatCount(summary.active)} label="Active" dot="bg-success" />
        <KpiTile value={formatCount(summary.inactive)} label="Inactive" dot="bg-ink-disabled" />
        <KpiTile value={formatCount(summary.special)} label="Special" dot="bg-primary" />
      </div>

      {listFailure && (
        <div className="mx-7 mb-3 shrink-0">
          <Alert type="danger">{listFailure.message}</Alert>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="mx-7 mb-3 flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-primary-border bg-primary-subtle py-2.25 pl-3.75 pr-2.5">
          <span className="whitespace-nowrap text-sm font-semibold text-primary-subtle-text">
            {formatCount(selectedIds.length)} selected
          </span>
          <div className="h-4.5 w-px bg-primary-border" />
          <Button
            theme="default"
            variant="outline"
            size="sm"
            disabled={bulkStatus.isPending}
            onClick={() => handleBulkStatus('Active')}
            iconLeft={<Icon name="check-circle" size={15} />}
          >
            Set active
          </Button>
          <Button
            theme="default"
            variant="outline"
            size="sm"
            disabled={bulkStatus.isPending}
            onClick={() => handleBulkStatus('Inactive')}
            iconLeft={<Icon name="prohibit" size={15} />}
          >
            Set inactive
          </Button>
          <Button
            theme="danger"
            variant="outline"
            size="sm"
            disabled={bulkDelete.isPending}
            onClick={() => setConfirmBulkDelete(true)}
            iconLeft={<Icon name="trash" size={15} />}
          >
            Delete
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
          {poojasQuery.isPending ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-ink-subtle">
              <Spinner size={28} />
              <span className="text-sm">Loading poojas…</span>
            </div>
          ) : (
            <Table<Pooja>
              columns={columns}
              rows={rows}
              onRowClick={(row) => openDetail(row.id)}
              selectedId={openPooja?.id ?? null}
              className={cn(stale && 'opacity-60')}
              empty={
                filtersActive ? (
                  <FilteredEmpty message="No poojas match your filters." onClear={clearFilters} />
                ) : (
                  'No poojas yet.'
                )
              }
            />
          )}
        </div>
      </div>

      <ListPagination
        total={count}
        page={page - 1}
        pageSize={pageSize}
        itemLabel="poojas"
        onPageChange={(next) => setPage(next + 1)}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      <PoojaDetailDrawer
        // `openPooja` is resolved from the page in hand, and a saved edit can
        // move a row off it. Closing is the honest outcome — falling through
        // would silently reopen the drawer as a blank *Add pooja* form.
        open={detailTarget === 'new' || openPooja != null}
        pooja={openPooja}
        gods={gods}
        nextSortOrder={summary.nextSortOrder}
        saving={createPooja.isPending || updatePooja.isPending}
        savedNonce={savedNonce}
        deleting={deletePooja.isPending}
        saveError={createPooja.error ?? updatePooja.error}
        deleteError={deletePooja.error}
        onClose={() => openDetail('closed')}
        onSave={handleSave}
        onDelete={(id) =>
          deletePooja.mutate(id, {
            onSuccess: () => {
              setDetailTarget('closed')
              showToast('Pooja deleted')
            },
          })
        }
      />

      <ImportPoojasModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={showToast}
      />

      <ConfirmModal
        open={pendingDelete != null}
        title="Delete pooja?"
        body={`"${pendingDelete?.name ?? ''}" will be permanently removed. A pooja that has been booked cannot be deleted — deactivate it instead.`}
        actionLabel="Delete"
        onConfirm={() => {
          const target = pendingDelete
          setPendingDelete(null)
          if (target) {
            deletePooja.mutate(target.id, { onSuccess: () => showToast('Pooja deleted') })
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title={`Delete ${selectedIds.length} pooja${selectedIds.length === 1 ? '' : 's'}?`}
        body="Poojas that have been booked are kept and reported back — the rest are permanently removed. This can’t be undone."
        actionLabel="Delete"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      <PoojaToast show={toast.show} message={toast.message} />
    </div>
  )
}
