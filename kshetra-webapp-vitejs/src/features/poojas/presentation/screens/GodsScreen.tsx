import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { toFailure } from '@/core/error/result'
import { DEFAULT_PAGE_SIZE } from '@/core/config/app'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn } from '@/shared/lib/cn'
import { formatCount } from '@/shared/lib/format'
import {
  Alert,
  Button,
  FilteredEmpty,
  Icon,
  Input,
  KpiTile,
  ListPagination,
  Select,
  Spinner,
  Switch,
  Table,
  Tooltip,
  type TableColumn,
} from '@/shared/ui'

import { godKeys } from '@/features/poojas/application/queries/god.keys'
import {
  useCreateGodMutation,
  useDeleteGodMutation,
  useReorderGodsMutation,
  useSetGodStatusMutation,
  useUpdateGodMutation,
} from '@/features/poojas/application/queries/useGodMutations'
import { useGodsQuery } from '@/features/poojas/application/queries/useGodsQuery'
import type { God } from '@/features/poojas/domain/entities/god'
import type { GodWrite } from '@/features/poojas/domain/repositories/god.repository'
import {
  ALL,
  defaultGodListFilters,
  godListFiltersActive,
  toGodFilters,
  type GodListFilterState,
} from '@/features/poojas/presentation/lib/godFilters'

import { GodDetailDrawer } from '../components/GodDetailDrawer'
import { PoojaToast } from '../components/PoojaToast'

/** 'closed' | 'new' | an existing god's id — drives the detail drawer. */
type DetailTarget = 'closed' | 'new' | number

const STATUS_FILTER_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const TOAST_MS = 2400
const EMPTY_SUMMARY = { total: 0, active: 0, inactive: 0, nextSortOrder: 1 } as const

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
  const navigate = useNavigate()

  const [filters, setFilters] = useState<GodListFilterState>(defaultGodListFilters)
  const debouncedSearch = useDebounce(filters.search)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [detailTarget, setDetailTarget] = useState<DetailTarget>('closed')
  const [savedNonce, setSavedNonce] = useState(0)

  /** Opening the drawer on a different god must not inherit the last one's error. */
  function openDetail(target: DetailTarget) {
    createGod.reset()
    updateGod.reset()
    deleteGod.reset()
    setDetailTarget(target)
  }
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useMemo(
    () => toGodFilters(filters, debouncedSearch.trim()),
    [filters, debouncedSearch],
  )
  const listKey = useMemo(() => godKeys.list(query), [query])
  const godsQuery = useGodsQuery(query)

  const createGod = useCreateGodMutation()
  const updateGod = useUpdateGodMutation()
  const setStatus = useSetGodStatusMutation()
  const deleteGod = useDeleteGodMutation()
  const reorder = useReorderGodsMutation(listKey)

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

  const gods = godsQuery.data?.results ?? []
  const summary = godsQuery.data?.summary ?? EMPTY_SUMMARY
  const stale = godsQuery.isPlaceholderData || godsQuery.isFetching
  const filtersActive = godListFiltersActive(filters)
  const listFailure =
    toFailure(godsQuery.error) ??
    toFailure(setStatus.error) ??
    toFailure(deleteGod.error) ??
    toFailure(reorder.error)

  const openGod =
    typeof detailTarget === 'number' ? (gods.find((g) => g.id === detailTarget) ?? null) : null

  /**
   * The list arrives whole and is paged here, because reordering has to send
   * every god exactly once — a server page could only ever be a partial order.
   */
  const total = gods.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageI = Math.min(page, pages - 1)
  const pageRows = gods.slice(pageI * pageSize, pageI * pageSize + pageSize)

  /**
   * Dragging is refused while a filter is on. What is on screen is then a
   * subset, and sending it as the order would drop every god the filter hid.
   */
  const canDrag = !filtersActive && !reorder.isPending

  function updateFilters(patch: Partial<GodListFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(0)
  }

  function clearFilters() {
    setFilters(defaultGodListFilters())
    setPage(0)
  }

  function handleSave(input: GodWrite) {
    if (detailTarget === 'new') {
      createGod.mutate(input, {
        onSuccess: () => {
          setDetailTarget('closed')
          showToast('God added')
        },
      })
      return
    }
    if (typeof detailTarget !== 'number') return
    updateGod.mutate(
      { id: detailTarget, input },
      {
        onSuccess: () => {
          // Stay open: the drawer drops back to its view pane so the operator
          // sees the saved record rather than the list they came from.
          setSavedNonce((n) => n + 1)
          showToast('God updated')
        },
      },
    )
  }

  function handleDelete(id: number) {
    deleteGod.mutate(id, {
      onSuccess: () => {
        setDetailTarget('closed')
        showToast('God deleted')
      },
    })
  }

  function handleDrop(overId: number) {
    const from = gods.findIndex((g) => g.id === dragId)
    const to = gods.findIndex((g) => g.id === overId)
    setDragId(null)
    setDragOverId(null)
    if (dragId == null || dragId === overId || from < 0 || to < 0) return

    // The complete order, never the page that was dragged on. The client
    // computes no `sort_order` — the server numbers them 1..N and its answer
    // replaces the optimistic guess.
    const ids = gods.map((g) => g.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved as number)
    reorder.mutate(ids, { onSuccess: () => showToast('God order updated') })
  }

  const columns: TableColumn<God>[] = [
    {
      key: 'handle',
      width: 40,
      header: '',
      render: () => (
        <span
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center justify-center text-ink-disabled',
            canDrag ? 'cursor-grab' : 'cursor-not-allowed opacity-50',
          )}
          title={canDrag ? 'Drag to reorder' : 'Clear the filters to reorder gods'}
        >
          <Icon name="dots-six-vertical" size={16} />
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (v) => <span className="font-medium text-ink-strong">{v as string}</span>,
    },
    {
      key: 'homeMediaUrl',
      header: 'Home image',
      render: (v) => <Thumb src={v as string | null} />,
    },
    { key: 'mediaUrl', header: 'Pooja image', render: (v) => <Thumb src={v as string | null} /> },
    {
      key: 'poojasCount',
      header: 'Poojas',
      align: 'right',
      render: (_v, row) =>
        row.poojasCount > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/poojas?god=${row.id}`)
            }}
            title="View this god’s poojas"
            className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm font-medium tabular-nums text-primary"
          >
            {formatCount(row.poojasCount)}
            <Icon name="arrow-up-right" size={11} />
          </button>
        ) : (
          <span className="tabular-nums text-ink-disabled">0</span>
        ),
    },
    {
      key: 'sortOrder',
      header: 'Sort order',
      align: 'right',
      render: (v) => <span className="tabular-nums text-ink-muted">{v as number}</span>,
    },
    {
      key: 'status',
      header: 'Status',
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
  ]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex shrink-0 items-start gap-4 px-7 pb-4 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">
            Gods
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Master data — every pooja references a god.
          </p>
        </div>
        <Button
          theme="primary"
          iconLeft={<Icon name="plus" size={16} />}
          onClick={() => openDetail('new')}
        >
          Add god
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-7 pb-3.5">
        <Input
          size="sm"
          placeholder="Search gods by name or ID…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          prefix={<Icon name="magnifying-glass" size={15} color="var(--text-subtle)" />}
          containerStyle={{ width: 280, maxWidth: '100%' }}
        />
        <Select
          size="sm"
          options={STATUS_FILTER_OPTIONS}
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
        />
        {filtersActive && (
          <Tooltip content="Reordering sends the whole list, so it is unavailable while a filter is on.">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-2xs text-ink-subtle shadow-xs">
              <Icon name="info" size={12} />
              Reordering paused
            </span>
          </Tooltip>
        )}
        <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">
          {formatCount(total)} {total === 1 ? 'god' : 'gods'}
        </span>
      </div>

      <div className={cn('flex shrink-0 flex-wrap gap-2.5 px-7 pb-3.5', stale && 'opacity-60')}>
        <KpiTile value={formatCount(summary.total)} label="gods" />
        <KpiTile value={formatCount(summary.active)} label="Active" dot="bg-success" />
        <KpiTile value={formatCount(summary.inactive)} label="Inactive" dot="bg-stroke-strong" />
      </div>

      {listFailure && (
        <div className="mx-7 mb-3 shrink-0">
          <Alert
            type="danger"
            title={toFailure(reorder.error) ? 'The order was not saved' : undefined}
          >
            {listFailure.message}
          </Alert>
        </div>
      )}

      <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          {godsQuery.isPending ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-ink-subtle">
              <Spinner size={28} />
              <span className="text-sm">Loading gods…</span>
            </div>
          ) : (
            <Table<God>
              columns={columns}
              rows={pageRows}
              onRowClick={(row) => openDetail(row.id)}
              selectedId={openGod?.id ?? null}
              className={cn(stale && 'opacity-60')}
              rowProps={(row) => ({
                draggable: canDrag,
                'aria-busy': reorder.isPending,
                onDragStart: (e: DragEvent<HTMLTableRowElement>) => {
                  // Firefox refuses to start a drag with no payload set.
                  e.dataTransfer.setData('text/plain', String(row.id))
                  e.dataTransfer.effectAllowed = 'move'
                  setDragId(row.id)
                },
                onDragOver: (e: DragEvent<HTMLTableRowElement>) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverId(row.id)
                },
                onDrop: (e: DragEvent<HTMLTableRowElement>) => {
                  e.preventDefault()
                  handleDrop(row.id)
                },
                onDragEnd: () => {
                  setDragId(null)
                  setDragOverId(null)
                },
                className: cn(
                  dragOverId === row.id && dragId !== row.id && 'bg-active',
                  dragId === row.id && 'bg-hover',
                ),
              })}
              empty={
                filtersActive ? (
                  <FilteredEmpty message="No gods match your filters." onClear={clearFilters} />
                ) : (
                  'No gods yet.'
                )
              }
            />
          )}
        </div>
      </div>

      <ListPagination
        total={total}
        page={pageI}
        pageSize={pageSize}
        itemLabel="gods"
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
      />

      <GodDetailDrawer
        // `openGod` is resolved from the list in hand, and a rename can move a
        // row out of the active filter. Closing is the honest outcome —
        // falling through would reopen the drawer as a blank *Add god* form.
        open={detailTarget === 'new' || openGod != null}
        god={openGod}
        nextSortOrder={summary.nextSortOrder}
        saving={createGod.isPending || updateGod.isPending}
        savedNonce={savedNonce}
        deleting={deleteGod.isPending}
        saveError={createGod.error ?? updateGod.error}
        deleteError={deleteGod.error}
        onClose={() => openDetail('closed')}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <PoojaToast show={toast.show} message={toast.message} />
    </div>
  )
}
