import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Icon, Spinner } from '@/shared/ui'
import { formatINR } from '@/shared/lib/format'

import type { AgentCode, AgentCodeStatus, AgentCodeValidityState } from '@/features/agent-codes/domain/entities/agent-code'
import { AGENT_CODE_USAGE } from '@/features/agent-codes/presentation/data/agent-code-usage.mock'
import { AGENT_CODES } from '@/features/agent-codes/presentation/data/agent-codes.mock'

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
import type { AgentCodeRow, AgentCodeSortKey } from '@/features/agent-codes/presentation/components/AgentCodesTable'
import { AgentCodesTable } from '@/features/agent-codes/presentation/components/AgentCodesTable'

const PULSE_MS = 260
const TOAST_MS = 2400

const STATUS_DOT: Record<AgentCodeStatus, string> = { Active: 'bg-success', Inactive: 'bg-gray-400' }
const STATUS_ORDER: AgentCodeStatus[] = ['Active', 'Inactive']

function blankForm(): AgentCodeFormValues {
  return { code: '', description: '', from: '', to: '', limit: '', status: 'Active' }
}

function formFromCode(agentCode: AgentCode): AgentCodeFormValues {
  return {
    code: agentCode.code,
    description: agentCode.description,
    from: agentCode.from,
    to: agentCode.to,
    limit: agentCode.limit ? String(agentCode.limit) : '',
    status: agentCode.status,
  }
}

/** "1 Jun 26" style short date, or an em-dash when blank. Mirrors the source's fmtDT. */
function formatValidityDate(value: string): string {
  if (!value) return '—'
  const [datePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const parsed = new Date(y, (m ?? 1) - 1, d ?? 1)
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function nowDateTimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function validityOf(agentCode: AgentCode): AgentCodeValidityState {
  const now = nowDateTimeLocal()
  if (agentCode.from && now < agentCode.from) return 'scheduled'
  if (agentCode.to && now > agentCode.to) return 'expired'
  return 'active'
}

function usageStatsFor(code: string): { used: number; value: number } {
  const rows = AGENT_CODE_USAGE.filter((u) => u.code === code)
  return { used: rows.length, value: rows.reduce((sum, u) => sum + u.amount, 0) }
}

function sortValue(agentCode: AgentCode, key: AgentCodeSortKey): string | number {
  if (key === 'uses') return usageStatsFor(agentCode.code).used
  if (key === 'orderValue') return usageStatsFor(agentCode.code).value
  if (key === 'validity') return agentCode.from
  return agentCode[key]
}

interface ConfirmState {
  open: boolean
  kind: AgentCodeConfirmKind | null
  id: string | null
}

interface FormErrorsState {
  code?: string
  dates?: boolean
}

/** Agent code list + create/edit/view detail. Route: /agent-codes. */
export function AgentCodesScreen() {
  const [codes, setCodes] = useState<AgentCode[]>(AGENT_CODES)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<AgentCodeStatusFilter>('all')
  const [filterValidity, setFilterValidity] = useState<AgentCodeValidityFilter>('any')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortKey, setSortKey] = useState<AgentCodeSortKey | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AgentCodeFormValues>(blankForm())
  const [errors, setErrors] = useState<FormErrorsState>({})

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, kind: null, id: null })
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  const formSignature = useRef<string | null>(null)
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pulse = () => {
    setLoading(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setLoading(false), PULSE_MS)
  }

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), TOAST_MS)
  }

  useEffect(() => {
    pulse()
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return codes.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (filterValidity !== 'any' && validityOf(c) !== filterValidity) return false
      if (q && !`${c.code} ${c.description}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [codes, search, filterStatus, filterValidity])

  const sortedCodes = useMemo(() => {
    const base = [...filteredCodes].sort((a, b) => a.code.localeCompare(b.code))
    if (!sortKey) return base
    const dir = sortDir === 'desc' ? -1 : 1
    return base.sort((a, b) => {
      const x = sortValue(a, sortKey)
      const y = sortValue(b, sortKey)
      if (typeof x === 'number' && typeof y === 'number') return dir * (x - y)
      return dir * String(x).localeCompare(String(y), undefined, { numeric: true })
    })
  }, [filteredCodes, sortKey, sortDir])

  const total = sortedCodes.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows: AgentCodeRow[] = sortedCodes.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map((c) => {
    const stats = usageStatsFor(c.code)
    return {
      id: c.id,
      code: c.code,
      description: c.description || '—',
      validity: `${formatValidityDate(c.from)} – ${formatValidityDate(c.to)}`,
      uses: c.limit ? `${stats.used} / ${c.limit}` : `${stats.used} / ∞`,
      orderValue: stats.value,
      status: c.status,
    }
  })

  const kpis: AgentCodeKpi[] = useMemo(() => {
    const counts: Partial<Record<AgentCodeStatus, number>> = {}
    filteredCodes.forEach((c) => {
      counts[c.status] = (counts[c.status] ?? 0) + 1
    })
    const list: AgentCodeKpi[] = [{ label: 'codes', value: String(filteredCodes.length) }]
    STATUS_ORDER.forEach((status) => {
      const count = counts[status]
      if (count) list.push({ label: status, value: String(count), dotClassName: STATUS_DOT[status] })
    })
    return list
  }, [filteredCodes])

  const filtersActive = search.trim() !== '' || filterStatus !== 'all' || filterValidity !== 'any'

  const handleClearFilters = () => {
    setSearch('')
    setFilterStatus('all')
    setFilterValidity('any')
    setPage(0)
    pulse()
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
    pulse()
  }
  const handleStatusFilterChange = (value: AgentCodeStatusFilter) => {
    setFilterStatus(value)
    setPage(0)
    pulse()
  }
  const handleValidityFilterChange = (value: AgentCodeValidityFilter) => {
    setFilterValidity(value)
    setPage(0)
    pulse()
  }

  const handleSort = (key: AgentCodeSortKey) => {
    setSortDir((prevDir) => (sortKey === key && prevDir === 'asc' ? 'desc' : 'asc'))
    setSortKey(key)
    setPage(0)
  }

  const handlePrev = () => setPage((p) => Math.max(0, p - 1))
  const handleNext = () => setPage((p) => Math.min(pageCount - 1, p + 1))
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  const handleAdd = () => {
    const initial = blankForm()
    formSignature.current = JSON.stringify(initial)
    setForm(initial)
    setErrors({})
    setEditingId(null)
    setFormView(false)
    setFormOpen(true)
  }

  const handleRowOpen = (row: AgentCodeRow) => {
    const record = codes.find((c) => c.id === row.id)
    if (!record) return
    const initial = formFromCode(record)
    formSignature.current = JSON.stringify(initial)
    setForm(initial)
    setErrors({})
    setEditingId(record.id)
    setFormView(true)
    setFormOpen(true)
  }

  const handleStartEdit = () => setFormView(false)

  function handleCancel() {
    const dirty = formSignature.current != null && !formView && JSON.stringify(form) !== formSignature.current
    if (dirty && !confirm.open) {
      setConfirm({ open: true, kind: 'discard', id: null })
      return
    }
    formSignature.current = null
    setFormOpen(false)
    setEditingId(null)
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
    setForm((prev) => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))
  }

  const handleSave = () => {
    const code = form.code.trim().toUpperCase()
    const nextErrors: FormErrorsState = {}
    if (!code) nextErrors.code = 'Code is required.'
    else if (codes.some((c) => c.code.toUpperCase() === code && c.id !== editingId)) nextErrors.code = 'This code already exists.'
    if (form.from && form.to && form.to <= form.from) nextErrors.dates = true
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    const limit = parseInt(form.limit, 10) || 0
    setCodes((prev) => {
      if (editingId) {
        return prev.map((c) => (c.id === editingId ? { ...c, code, description: form.description, from: form.from, to: form.to, limit, status: form.status } : c))
      }
      const newCode: AgentCode = {
        id: `AC-${prev.length + 1}-${Date.now().toString(36)}`,
        code,
        description: form.description,
        from: form.from,
        to: form.to,
        limit,
        status: form.status,
      }
      return [newCode, ...prev]
    })
    formSignature.current = null
    setFormOpen(false)
    setEditingId(null)
    setErrors({})
    showToast('Code saved')
  }

  const handleToggleRowStatus = (id: string) => {
    const record = codes.find((c) => c.id === id)
    if (!record) return
    if (record.status === 'Active') {
      setConfirm({ open: true, kind: 'deactivate', id })
      return
    }
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Active' } : c)))
    showToast(`${record.code} activated`)
  }

  const handleAskDelete = () => setConfirm({ open: true, kind: 'delete', id: editingId })

  const handleConfirmNo = () => setConfirm({ open: false, kind: null, id: null })

  const handleConfirmYes = () => {
    if (confirm.kind === 'discard') {
      formSignature.current = null
      setFormOpen(false)
      setEditingId(null)
      setConfirm({ open: false, kind: null, id: null })
      return
    }
    const record = confirm.id ? codes.find((c) => c.id === confirm.id) : undefined
    if (confirm.kind === 'deactivate' && confirm.id) {
      const id = confirm.id
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Inactive' } : c)))
      if (editingId === id) setForm((prev) => ({ ...prev, status: 'Inactive' }))
      setConfirm({ open: false, kind: null, id: null })
      showToast(`${record ? record.code : 'Code'} deactivated`)
      return
    }
    if (confirm.kind === 'delete' && confirm.id) {
      const id = confirm.id
      setCodes((prev) => prev.filter((c) => c.id !== id))
      setConfirm({ open: false, kind: null, id: null })
      setFormOpen(false)
      setEditingId(null)
      showToast(`${record ? record.code : 'Code'} deleted`)
      return
    }
    setConfirm({ open: false, kind: null, id: null })
  }

  const editingRecord = editingId ? codes.find((c) => c.id === editingId) : null
  const editingStats = editingRecord ? usageStatsFor(editingRecord.code) : { used: 0, value: 0 }
  const usageRows = editingRecord ? AGENT_CODE_USAGE.filter((u) => u.code === editingRecord.code) : []
  const deleteDisabled = editingStats.used > 0
  const deleteNote = deleteDisabled
    ? `Can’t delete — used on ${editingStats.used} booking${editingStats.used === 1 ? '' : 's'}. Deactivate instead to keep records.`
    : 'This code has zero uses, so it can be permanently deleted.'

  const isView = !!(formView && editingId)
  const formTitle = editingId ? form.code || 'Edit code' : 'New code'

  const pageInfo = total ? `Showing ${currentPage * pageSize + 1}–${Math.min(total, (currentPage + 1) * pageSize)} of ${total} codes` : 'No codes'
  const pageLabel = `Page ${currentPage + 1} of ${pageCount}`

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
          <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={handleAdd}>
            Add code
          </Button>
        </div>

        <AgentCodeFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          status={filterStatus}
          onStatusChange={handleStatusFilterChange}
          validity={filterValidity}
          onValidityChange={handleValidityFilterChange}
        />

        <AgentCodeKpiBand kpis={kpis} />

        {loading ? (
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
          onPageSizeChange={handlePageSizeChange}
          pageLabel={pageLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          prevDisabled={currentPage <= 0}
          nextDisabled={currentPage >= pageCount - 1}
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
          errors={errors}
          fromDisplay={formatValidityDate(form.from)}
          toDisplay={formatValidityDate(form.to)}
          onFieldChange={handleFieldChange}
          onStatusToggle={handleStatusToggle}
          isExistingRecord={!!editingId}
          usedLabel={editingStats.used.toLocaleString('en-IN')}
          orderValueLabel={formatINR(editingStats.value)}
          usageSummary={`${editingStats.used} ${editingStats.used === 1 ? 'booking' : 'bookings'}`}
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
