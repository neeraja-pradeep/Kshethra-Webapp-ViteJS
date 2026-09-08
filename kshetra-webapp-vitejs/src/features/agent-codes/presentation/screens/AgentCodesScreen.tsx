import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Button, Icon, Spinner } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useAgentCodeStatusMutation,
  useCreateAgentCodeMutation,
  useDeleteAgentCodeMutation,
  useUpdateAgentCodeMutation,
} from '@/features/agent-codes/application/queries/useAgentCodeMutations'
import {
  useAgentCodeQuery,
  useAgentCodesQuery,
} from '@/features/agent-codes/application/queries/useAgentCodeQueries'
import type { AgentCodeWrite } from '@/features/agent-codes/domain/entities/agent-code'
import type { AgentCodeFilters } from '@/features/agent-codes/domain/repositories/agent-code.repository'

import { AgentCodeConfirmModal } from '@/features/agent-codes/presentation/components/AgentCodeConfirmModal'
import type { AgentCodeConfirmKind } from '@/features/agent-codes/presentation/components/AgentCodeConfirmModal'
import { AgentCodeDetailPanel } from '@/features/agent-codes/presentation/components/AgentCodeDetailPanel'
import { AgentCodeFilterBar } from '@/features/agent-codes/presentation/components/AgentCodeFilterBar'
import type { AgentCodeStatusFilter, AgentCodeValidityFilter } from '@/features/agent-codes/presentation/components/AgentCodeFilterBar'
import type { AgentCodeFormField, AgentCodeFormValues } from '@/features/agent-codes/presentation/components/AgentCodeFormCard'
import { AgentCodeKpiBand } from '@/features/agent-codes/presentation/components/AgentCodeKpiBand'
import type { AgentCodeKpi } from '@/features/agent-codes/presentation/components/AgentCodeKpiBand'
import { AgentCodePagination } from '@/features/agent-codes/presentation/components/AgentCodePagination'
import { AgentCodeToast } from '@/features/agent-codes/presentation/components/AgentCodeToast'
import type { AgentCodeUsageRowView } from '@/features/agent-codes/presentation/components/AgentCodeUsageCard'
import type { AgentCodeRow, AgentCodeSortKey } from '@/features/agent-codes/presentation/components/AgentCodesTable'
import { AgentCodesTable } from '@/features/agent-codes/presentation/components/AgentCodesTable'
import {
  formatUses,
  formatValidityDate,
  toDateTimeLocal,
} from '@/features/agent-codes/presentation/lib/agentCodeDisplay'

const TOAST_MS = 2400
/** One request per pause in typing, not per keystroke. */
const SEARCH_DEBOUNCE_MS = 300
const DEFAULT_PAGE_SIZE = 20

/** The server's ordering vocabulary, keyed by the column the header sorts. */
const ORDERING_PARAM: Record<AgentCodeSortKey, string> = {
  code: 'code',
  description: 'description',
  validity: 'validity',
  uses: 'uses',
  orderValue: 'order_value',
  status: 'status',
}

const EMPTY_SUMMARY = { total: 0, active: 0, inactive: 0 }

function blankForm(): AgentCodeFormValues {
  return { code: '', description: '', from: '', to: '', limit: '', status: 'active' }
}

interface ConfirmState {
  open: boolean
  kind: AgentCodeConfirmKind | null
  id: number | null
}

/**
 * Agent code list + create/edit/view detail. Route: `/agent-codes`.
 *
 * The search, both filters, the sort and the paging are all applied by the
 * server, and the tiles come from its `summary`. None of it is done here: the
 * list is paged, so filtering the loaded rows would report one page's matches
 * as though it were the whole screen — and the search reaches a Malayalam
 * description through its romanized spelling, which no client-side match could.
 */
export function AgentCodesScreen() {
  const can = useCan()
  /** Read is deliberately wide; writing is Admin's and Manager's only. */
  const canWrite = can(PERMISSIONS.addAgentCode)
  const canDelete = can(PERMISSIONS.deleteAgentCode)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<AgentCodeStatusFilter>('all')
  const [filterValidity, setFilterValidity] = useState<AgentCodeValidityFilter>('any')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortKey, setSortKey] = useState<AgentCodeSortKey | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AgentCodeFormValues>(blankForm())
  /** Local rules only — the server's own field errors are read off the mutation. */
  const [localErrors, setLocalErrors] = useState<{ code?: string; dates?: boolean }>({})

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, kind: null, id: null })
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  const formSignature = useRef<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), TOAST_MS)
  }

  const filters: AgentCodeFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(filterStatus === 'all' ? {} : { status: filterStatus }),
      ...(filterValidity === 'any' ? {} : { validity: filterValidity }),
      ...(sortKey ? { ordering: `${sortDir === 'desc' ? '-' : ''}${ORDERING_PARAM[sortKey]}` } : {}),
      page,
      pageSize,
    }),
    [debouncedSearch, filterStatus, filterValidity, sortKey, sortDir, page, pageSize],
  )

  const codesQuery = useAgentCodesQuery(filters)
  const detailQuery = useAgentCodeQuery(formOpen ? editingId : null)
  const createCode = useCreateAgentCodeMutation()
  const updateCode = useUpdateAgentCodeMutation()
  const statusMutation = useAgentCodeStatusMutation()
  const deleteMutation = useDeleteAgentCodeMutation()

  const rows = useMemo(() => codesQuery.data?.results ?? [], [codesQuery.data])
  const summary = codesQuery.data?.summary ?? EMPTY_SUMMARY
  const total = codesQuery.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const pageRows: AgentCodeRow[] = rows.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description || '—',
    validity: `${formatValidityDate(c.validFrom)} – ${formatValidityDate(c.validTo)}`,
    uses: formatUses(c.uses, c.usageLimit),
    orderValue: c.orderValue,
    status: c.status,
  }))

  /**
   * Straight from `summary`, never from `results.length` — it is counted over
   * the search and validity filters but deliberately not over `status`, so the
   * two status tiles keep their counts when one of them is the active filter.
   */
  const kpis: AgentCodeKpi[] = [
    { label: 'codes', value: String(summary.total) },
    { label: 'Active', value: String(summary.active), dotClassName: 'bg-success' },
    { label: 'Inactive', value: String(summary.inactive), dotClassName: 'bg-gray-400' },
  ]

  const filtersActive = debouncedSearch !== '' || filterStatus !== 'all' || filterValidity !== 'any'
  const detail = detailQuery.data ?? null
  const saving = createCode.isPending || updateCode.isPending

  function resetPaging() {
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterStatus('all')
    setFilterValidity('any')
    resetPaging()
  }

  const handleSort = (key: AgentCodeSortKey) => {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    resetPaging()
  }

  function closeForm() {
    formSignature.current = null
    setFormOpen(false)
    setEditingId(null)
    setLocalErrors({})
    createCode.reset()
    updateCode.reset()
  }

  const handleAdd = () => {
    const initial = blankForm()
    formSignature.current = JSON.stringify(initial)
    setForm(initial)
    setLocalErrors({})
    createCode.reset()
    updateCode.reset()
    setEditingId(null)
    setFormView(false)
    setFormOpen(true)
  }

  const handleRowOpen = (row: AgentCodeRow) => {
    setEditingId(row.id)
    setFormView(true)
    setFormOpen(true)
    setLocalErrors({})
    createCode.reset()
    updateCode.reset()
  }

  /** The form is seeded once the detail lands, so an edit starts from the server's copy. */
  useEffect(() => {
    if (!detail || editingId === null) return
    const seeded: AgentCodeFormValues = {
      code: detail.code,
      description: detail.description,
      from: toDateTimeLocal(detail.validFrom),
      to: toDateTimeLocal(detail.validTo),
      limit: detail.usageLimit === null ? '' : String(detail.usageLimit),
      status: detail.status,
    }
    formSignature.current = JSON.stringify(seeded)
    setForm(seeded)
  }, [detail, editingId])

  const handleStartEdit = () => setFormView(false)

  function handleCancel() {
    const dirty = formSignature.current != null && !formView && JSON.stringify(form) !== formSignature.current
    if (dirty && !confirm.open) {
      setConfirm({ open: true, kind: 'discard', id: null })
      return
    }
    closeForm()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (confirm.open) {
        setConfirm({ open: false, kind: null, id: null })
        return
      }
      if (formOpen) handleCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm.open, formOpen, form, formView])

  const handleFieldChange = (field: AgentCodeFormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStatusToggle = () => {
    setForm((prev) => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))
  }

  /**
   * Every field is sent, blanks as explicit `null`.
   *
   * On a PATCH `null` clears and absent leaves alone, so a date the operator
   * cleared has to arrive as null — dropping the key would silently keep the
   * old window. `0` in the limit field is sent as null too: the server stores it
   * that way, and the form means "no ceiling" by it.
   */
  function toWrite(): AgentCodeWrite {
    const limit = form.limit.trim() === '' ? null : Number(form.limit)
    return {
      code: form.code.trim(),
      description: form.description,
      validFrom: form.from || null,
      validTo: form.to || null,
      usageLimit: limit === null || Number.isNaN(limit) || limit === 0 ? null : limit,
      status: form.status,
    }
  }

  const handleSave = () => {
    const nextErrors: { code?: string; dates?: boolean } = {}
    if (!form.code.trim()) nextErrors.code = 'Code is required.'
    if (form.from && form.to && form.to <= form.from) nextErrors.dates = true
    if (Object.keys(nextErrors).length) {
      setLocalErrors(nextErrors)
      return
    }
    setLocalErrors({})
    const input = toWrite()
    const onDone = (message: string) => () => {
      closeForm()
      showToast(message)
    }
    if (editingId === null) createCode.mutate(input, { onSuccess: onDone('Code created') })
    else updateCode.mutate({ id: editingId, input }, { onSuccess: onDone('Code saved') })
  }

  const handleToggleRowStatus = (id: number) => {
    const record = rows.find((c) => c.id === id)
    if (!record) return
    if (record.status === 'active') {
      setConfirm({ open: true, kind: 'deactivate', id })
      return
    }
    statusMutation.mutate(
      { id, status: 'active' },
      { onSuccess: () => showToast(`${record.code} activated`) },
    )
  }

  const handleAskDelete = () => setConfirm({ open: true, kind: 'delete', id: editingId })

  const handleConfirmNo = () => setConfirm({ open: false, kind: null, id: null })

  const handleConfirmYes = () => {
    if (confirm.kind === 'discard') {
      closeForm()
      setConfirm({ open: false, kind: null, id: null })
      return
    }
    const id = confirm.id
    if (id === null) {
      setConfirm({ open: false, kind: null, id: null })
      return
    }
    const label = rows.find((c) => c.id === id)?.code ?? detail?.code ?? 'Code'
    if (confirm.kind === 'deactivate') {
      statusMutation.mutate(
        { id, status: 'inactive' },
        {
          onSuccess: () => {
            if (editingId === id) setForm((prev) => ({ ...prev, status: 'inactive' }))
            showToast(`${label} deactivated`)
          },
        },
      )
      setConfirm({ open: false, kind: null, id: null })
      return
    }
    if (confirm.kind === 'delete') {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          closeForm()
          showToast(`${label} deleted`)
        },
      })
      setConfirm({ open: false, kind: null, id: null })
      return
    }
    setConfirm({ open: false, kind: null, id: null })
  }

  const usageRows: AgentCodeUsageRowView[] = (detail?.usage.bookings ?? []).map((b) => ({
    orderRef: b.orderRef,
    devotee: b.devotee,
    poojaSummary: b.poojaSummary || '—',
    date: b.date ? formatValidityDate(b.date) : '—',
    amount: b.amount,
    paid: b.paid,
  }))

  /**
   * The delete card reads the server's `deletable`, not the booking list: that
   * list is capped at 50 while the guard counts every booking, and a code can
   * be undeletable with zero uses when a devotee holds it in a live cart.
   */
  const deleteDisabled = !canDelete || !detail?.deletable
  const deleteNote = !detail
    ? 'Loading…'
    : detail.deletable
      ? 'This code has zero uses, so it can be permanently deleted.'
      : detail.usage.timesUsed > 0
        ? `Can’t delete — used on ${detail.usage.timesUsed} booking${detail.usage.timesUsed === 1 ? '' : 's'}. Deactivate instead to keep records.`
        : `Can’t delete — held in ${detail.activeCarts} live cart${detail.activeCarts === 1 ? '' : 's'} right now. Try again once the cart clears.`

  const isView = !!(formView && editingId !== null)
  const formTitle = editingId !== null ? form.code || 'Edit code' : 'New code'

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(total, page * pageSize)
  const pageInfo = total ? `Showing ${firstRow}–${lastRow} of ${total} codes` : 'No codes'
  const pageLabel = `Page ${page} of ${pageCount}`

  /** The server's field errors win over the local ones — it validates more. */
  const serverFailure = toFailure(createCode.error) ?? toFailure(updateCode.error)
  const serverFieldErrors = serverFailure?.kind === 'validation' ? serverFailure.fieldErrors : {}
  const formErrors = {
    code: serverFieldErrors.code?.[0] ?? localErrors.code,
    dates: serverFieldErrors.valid_to !== undefined || serverFieldErrors.valid_from !== undefined || localErrors.dates,
  }
  /** Anything the form has no field for — a 403, a network drop, a 404. */
  const formBanner =
    serverFailure && Object.keys(serverFieldErrors).length === 0 ? serverFailure.message : null

  const listFailure = codesQuery.isError
    ? (toFailure(codesQuery.error)?.message ?? 'Agent codes could not be loaded.')
    : null
  const deleteFailure = deleteMutation.isError
    ? (toFailure(deleteMutation.error)?.message ?? 'This code could not be deleted.')
    : null

  const emptyContent = filtersActive ? (
    <span className="inline-flex items-center gap-3">
      No codes match your filters.
      <button
        type="button"
        onClick={handleClearFilters}
        className="rounded-full border-none bg-card px-3.25 py-1.5 text-xs font-medium text-primary shadow-xs"
      >
        Clear filters
      </button>
    </span>
  ) : (
    'No codes yet.'
  )

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Agent code</h1>
            <p className="m-0 mt-1.5 text-sm text-ink-muted">Codes devotees apply in the app to pay for a booking at the temple counter.</p>
          </div>
          {/* Hidden rather than disabled for a read-only role — the API would 403. */}
          {canWrite && (
            <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={handleAdd}>
              Add code
            </Button>
          )}
        </div>

        <AgentCodeFilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            resetPaging()
          }}
          status={filterStatus}
          onStatusChange={(value) => {
            setFilterStatus(value)
            resetPaging()
          }}
          validity={filterValidity}
          onValidityChange={(value) => {
            setFilterValidity(value)
            resetPaging()
          }}
        />

        <AgentCodeKpiBand kpis={kpis} />

        {(listFailure || deleteFailure) && (
          <div className="px-7 pb-3">
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {listFailure ?? deleteFailure}
            </Alert>
          </div>
        )}

        {codesQuery.isPending ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        ) : (
          <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
            <div className="min-h-0 flex-1 overflow-auto">
              <AgentCodesTable
                rows={pageRows}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={handleRowOpen}
                onToggleStatus={handleToggleRowStatus}
                empty={emptyContent}
              />
            </div>
          </div>
        )}

        <AgentCodePagination
          pageInfo={pageInfo}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            resetPaging()
          }}
          pageLabel={pageLabel}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
          prevDisabled={page <= 1}
          nextDisabled={page >= pageCount}
        />
      </div>

      {formOpen && (
        <AgentCodeDetailPanel
          title={formTitle}
          isView={isView}
          onBack={handleCancel}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          form={form}
          errors={formErrors}
          banner={formBanner}
          saving={saving}
          canEdit={canWrite}
          loading={editingId !== null && detailQuery.isPending}
          fromDisplay={formatValidityDate(detail?.validFrom ?? null)}
          toDisplay={formatValidityDate(detail?.validTo ?? null)}
          onFieldChange={handleFieldChange}
          onStatusToggle={handleStatusToggle}
          isExistingRecord={editingId !== null}
          usedLabel={(detail?.usage.timesUsed ?? 0).toLocaleString('en-IN')}
          orderValueLabel={formatINR(detail?.usage.totalOrderValue ?? 0)}
          usageSummary={
            detail?.usage.hasMore
              ? `Most recent ${usageRows.length} of ${detail.usage.timesUsed} bookings`
              : `${detail?.usage.timesUsed ?? 0} ${detail?.usage.timesUsed === 1 ? 'booking' : 'bookings'}`
          }
          usageRows={usageRows}
          deleteDisabled={deleteDisabled}
          deleteNote={deleteNote}
          onDelete={handleAskDelete}
        />
      )}

      <AgentCodeConfirmModal open={confirm.open} kind={confirm.kind} onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />
      <AgentCodeToast show={toast.show} message={toast.msg} />
    </div>
  )
}
