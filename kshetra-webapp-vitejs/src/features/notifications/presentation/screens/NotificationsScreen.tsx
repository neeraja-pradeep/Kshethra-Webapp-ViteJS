import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Icon, Spinner, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { formatCount } from '@/shared/lib/format'

import type { Notification, NotificationAudience, NotificationDelivery, NotificationStatus } from '@/features/notifications/domain/entities/notification'
import { NAKSHATRAS } from '@/features/notifications/presentation/data/nakshatras.mock'
import { NOTIFICATIONS, TOTAL_APP_USERS } from '@/features/notifications/presentation/data/notifications.mock'
import { POOJA_NAMES } from '@/features/notifications/presentation/data/poojas.mock'
import { estimateRecipients, formatNotificationTime, notificationAudienceLabel } from '@/features/notifications/presentation/lib/notification-format'
import { ComposeNotificationView } from '@/features/notifications/presentation/components/ComposeNotificationView'
import type { NotificationFormErrors, NotificationFormValues } from '@/features/notifications/presentation/components/ComposeNotificationView'
import { ConfirmNotificationModal } from '@/features/notifications/presentation/components/ConfirmNotificationModal'
import { NotificationStatusBadge } from '@/features/notifications/presentation/components/NotificationStatusBadge'
import { NotificationToast } from '@/features/notifications/presentation/components/NotificationToast'
import { NotificationsFilterBar } from '@/features/notifications/presentation/components/NotificationsFilterBar'
import type { NotificationsBannerFilter, NotificationsStatusFilter, NotificationsTargetFilter } from '@/features/notifications/presentation/components/NotificationsFilterBar'
import { NotificationsKpiBand } from '@/features/notifications/presentation/components/NotificationsKpiBand'
import { NotificationsPagination } from '@/features/notifications/presentation/components/NotificationsPagination'
import { SortableColumnHeader } from '@/features/notifications/presentation/components/SortableColumnHeader'

type SortKey = 'title' | 'target' | 'banner' | 'time' | 'status' | ''
type ConfirmKind = 'discard' | 'send'

interface NotificationRow {
  id: string
  title: string
  target: string
  banner: boolean
  time: string
  status: NotificationStatus
}

function createBlankForm(): NotificationFormValues {
  return {
    title: '',
    description: '',
    banner: false,
    bannerImage: null,
    poojaId: '',
    target: 'all',
    naks: [],
    delivery: 'now',
    schedDate: '',
    schedTime: '',
  }
}

const STATUS_ORDER: Record<NotificationStatus, number> = { Draft: 0, Scheduled: 1, Sent: 2 }

function sortValue(row: Notification, key: SortKey): string | number {
  if (key === 'banner') return row.banner ? 1 : 0
  if (key === 'target') return notificationAudienceLabel(row)
  if (key === 'time') return row.time
  if (key === 'title') return row.title
  if (key === 'status') return row.status
  return ''
}

/** Notifications list + compose experience — broadcast messages to app users. */
export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<NotificationsStatusFilter>('all')
  const [targetFilter, setTargetFilter] = useState<NotificationsTargetFilter>('any')
  const [bannerFilter, setBannerFilter] = useState<NotificationsBannerFilter>('any')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortKey, setSortKey] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)

  const [composeOpen, setComposeOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formView, setFormView] = useState(false)
  const [form, setForm] = useState<NotificationFormValues>(createBlankForm())
  const [errors, setErrors] = useState<NotificationFormErrors>({})
  const formSignatureRef = useRef<string | null>(null)

  const [confirm, setConfirm] = useState<{ open: boolean; kind: ConfirmKind }>({ open: false, kind: 'send' })
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Brief loading pulse whenever the visible slice of data changes.
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 260)
    return () => clearTimeout(timer)
  }, [search, statusFilter, targetFilter, bannerFilter, page, pageSize])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  function handleCancel() {
    const hasUnsavedChanges = formSignatureRef.current !== null && !formView && JSON.stringify(form) !== formSignatureRef.current
    if (hasUnsavedChanges && !confirm.open) {
      setConfirm({ open: true, kind: 'discard' })
      return
    }
    formSignatureRef.current = null
    setComposeOpen(false)
    setEditingId(null)
  }

  // Escape closes the topmost surface: the confirm dialog, then compose.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirm.open) {
        setConfirm((prev) => ({ ...prev, open: false }))
        return
      }
      if (composeOpen) handleCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm.open, composeOpen, form, formView])

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase()
    const rows = notifications.filter((n) => {
      if (statusFilter !== 'all' && n.status !== statusFilter) return false
      if (targetFilter !== 'any' && n.target !== targetFilter) return false
      if (bannerFilter === 'yes' && !n.banner) return false
      if (bannerFilter === 'no' && n.banner) return false
      if (query) {
        const haystack = `${n.title} ${n.description} ${notificationAudienceLabel(n)}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    rows.sort((a, b) => {
      if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      return b.time.localeCompare(a.time)
    })
    return rows
  }, [notifications, search, statusFilter, targetFilter, bannerFilter])

  const sortedNotifications = useMemo(() => {
    if (!sortKey) return filteredNotifications
    const dir = sortDir === 'desc' ? -1 : 1
    return [...filteredNotifications].sort((a, b) => {
      const x = sortValue(a, sortKey)
      const y = sortValue(b, sortKey)
      if (typeof x === 'number' && typeof y === 'number') return dir * (x - y)
      return dir * String(x).localeCompare(String(y), undefined, { numeric: true })
    })
  }, [filteredNotifications, sortKey, sortDir])

  const total = sortedNotifications.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows: NotificationRow[] = sortedNotifications.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map((n) => ({
    id: n.id,
    title: n.title,
    target: notificationAudienceLabel(n),
    banner: n.banner,
    time: formatNotificationTime(n.time),
    status: n.status,
  }))

  const filtersActive = search.trim() !== '' || statusFilter !== 'all' || targetFilter !== 'any' || bannerFilter !== 'any'
  const pageInfo = total > 0
    ? `Showing ${currentPage * pageSize + 1}–${Math.min(total, (currentPage + 1) * pageSize)} of ${total} notifications`
    : 'No notifications'
  const pageLabel = `Page ${currentPage + 1} of ${pageCount}`

  function handleClearFilters() {
    setSearch('')
    setStatusFilter('all')
    setTargetFilter('any')
    setBannerFilter('any')
    setPage(0)
  }

  const emptyContent = filtersActive ? (
    <span className="inline-flex items-center gap-3">
      No notifications match your filters.
      <button
        type="button"
        onClick={handleClearFilters}
        className="cursor-pointer whitespace-nowrap rounded-full border-none bg-card px-3.25 py-1.5 text-xs font-medium text-primary shadow-xs"
      >
        Clear filters
      </button>
    </span>
  ) : (
    'No notifications yet.'
  )

  function handleSort(key: Exclude<SortKey, ''>) {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(nextDir)
    setPage(0)
  }

  const columns: TableColumn<NotificationRow>[] = [
    {
      key: 'title',
      header: <SortableColumnHeader label="Title" active={sortKey === 'title'} direction={sortDir} onSort={() => handleSort('title')} />,
      render: (value) => <span className="font-medium text-ink-strong">{value as string}</span>,
    },
    {
      key: 'target',
      header: <SortableColumnHeader label="Target" active={sortKey === 'target'} direction={sortDir} onSort={() => handleSort('target')} />,
      render: (value) => <span className="text-ink-muted">{value as string}</span>,
    },
    {
      key: 'banner',
      header: <SortableColumnHeader label="Banner" active={sortKey === 'banner'} direction={sortDir} onSort={() => handleSort('banner')} />,
      render: (value) =>
        value ? (
          <span className="inline-flex items-center gap-1.25 text-primary">
            <Icon name="image" weight="fill" size={14} />
            Yes
          </span>
        ) : (
          <span className="text-ink-disabled">No</span>
        ),
    },
    {
      key: 'time',
      header: <SortableColumnHeader label="Send time" active={sortKey === 'time'} direction={sortDir} onSort={() => handleSort('time')} />,
      render: (value) => <span className="whitespace-nowrap text-ink-muted">{value as string}</span>,
    },
    {
      key: 'status',
      header: <SortableColumnHeader label="Status" active={sortKey === 'status'} direction={sortDir} onSort={() => handleSort('status')} />,
      render: (value) => <NotificationStatusBadge status={value as NotificationStatus} />,
    },
  ]

  function handleOpenNew() {
    const next = createBlankForm()
    formSignatureRef.current = JSON.stringify(next)
    setForm(next)
    setErrors({})
    setEditingId(null)
    setFormView(false)
    setComposeOpen(true)
  }

  function handleOpenEdit(id: string) {
    const existing = notifications.find((n) => n.id === id)
    if (!existing) return
    const next: NotificationFormValues = {
      ...createBlankForm(),
      title: existing.title,
      description: existing.description,
      banner: existing.banner,
      target: existing.target,
      naks: [...existing.naks],
      delivery: existing.status === 'Scheduled' ? 'schedule' : 'now',
    }
    formSignatureRef.current = JSON.stringify(next)
    setForm(next)
    setErrors({})
    setEditingId(id)
    setFormView(true)
    setComposeOpen(true)
  }

  function setFormField<K extends keyof NotificationFormValues>(key: K, value: NotificationFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleToggleNakshatra(name: string) {
    setForm((prev) => ({
      ...prev,
      naks: prev.naks.includes(name) ? prev.naks.filter((n) => n !== name) : [...prev.naks, name],
    }))
  }

  function handleBannerImageChange(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setFormField('bannerImage', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function validateForm(): NotificationFormErrors {
    const nextErrors: NotificationFormErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (form.target === 'nakshatra' && form.naks.length === 0) nextErrors.naks = true
    if (form.delivery === 'schedule' && (!form.schedDate || !form.schedTime)) nextErrors.sched = true
    return nextErrors
  }

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast({ show: false, message: '' }), 2400)
  }

  function nowStamp(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function persistNotification(status: NotificationStatus, onDone: () => void) {
    const time = status === 'Scheduled' ? `${form.schedDate} ${form.schedTime}` : status === 'Sent' ? nowStamp() : ''
    const record: Notification = {
      id: editingId ?? `NT-${notifications.length + 1}-${Date.now().toString(36)}`,
      title: form.title.trim(),
      description: form.description,
      target: form.target,
      naks: [...form.naks],
      banner: form.banner,
      status,
      time,
    }
    setNotifications((prev) => (editingId ? prev.map((n) => (n.id === editingId ? record : n)) : [record, ...prev]))
    setComposeOpen(false)
    setEditingId(null)
    setConfirm({ open: false, kind: 'send' })
    onDone()
  }

  function handleSaveDraft() {
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required.' })
      return
    }
    persistNotification('Draft', () => showToast('Saved as draft'))
  }

  function handleSend() {
    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setConfirm({ open: true, kind: 'send' })
  }

  function handleConfirmYes() {
    if (confirm.kind === 'discard') {
      formSignatureRef.current = null
      setConfirm({ open: false, kind: 'send' })
      setComposeOpen(false)
      setEditingId(null)
      return
    }
    const status: NotificationStatus = form.delivery === 'schedule' ? 'Scheduled' : 'Sent'
    persistNotification(status, () => showToast(status === 'Sent' ? 'Notification sent' : 'Notification scheduled'))
  }

  function handleConfirmNo() {
    setConfirm((prev) => ({ ...prev, open: false }))
  }

  const recipientEstimate = estimateRecipients(form.target, form.naks, TOTAL_APP_USERS)
  const recipientEstimateLabel = `~${formatCount(recipientEstimate)} ${form.target === 'all' ? 'users' : 'devotees'}`

  let confirmTitle = ''
  let confirmBody = ''
  let confirmActionLabel = 'Send now'
  if (confirm.kind === 'discard') {
    confirmTitle = 'Discard changes?'
    confirmBody = 'Your unsaved changes to this notification will be lost.'
    confirmActionLabel = 'Discard'
  } else {
    const isSchedule = form.delivery === 'schedule'
    confirmTitle = isSchedule ? 'Schedule notification?' : 'Send notification now?'
    const prefix = isSchedule
      ? 'This notification will be delivered at the scheduled time to '
      : 'This notification will be delivered immediately to '
    const suffix = form.target === 'all' ? ' app users.' : ' devotees matching the selected nakshatras (account holders and family).'
    confirmBody = `${prefix}~${formatCount(recipientEstimate)}${suffix}`
    confirmActionLabel = isSchedule ? 'Schedule' : 'Send now'
  }

  const composeMode: 'view' | 'edit' = formView && editingId ? 'view' : 'edit'
  const composeTitle = editingId ? form.title || 'Edit notification' : 'New notification'

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Notifications</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Broadcast messages to app users.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={handleOpenNew}>
          New notification
        </Button>
      </div>

      <NotificationsFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(0)
        }}
        status={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v)
          setPage(0)
        }}
        target={targetFilter}
        onTargetChange={(v) => {
          setTargetFilter(v)
          setPage(0)
        }}
        banner={bannerFilter}
        onBannerChange={(v) => {
          setBannerFilter(v)
          setPage(0)
        }}
      />

      <NotificationsKpiBand rows={filteredNotifications} />

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner size={40} />
        </div>
      ) : (
        <div className="mx-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
          <div className="min-h-0 flex-1 overflow-auto">
            <Table columns={columns} rows={pageRows} onRowClick={(row) => handleOpenEdit(row.id)} empty={emptyContent} />
          </div>
        </div>
      )}

      <NotificationsPagination
        pageInfo={pageInfo}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        pageLabel={pageLabel}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        prevDisabled={currentPage <= 0}
        nextDisabled={currentPage >= pageCount - 1}
      />

      {composeOpen && (
        <ComposeNotificationView
          mode={composeMode}
          title={composeTitle}
          form={form}
          errors={errors}
          nakshatras={NAKSHATRAS}
          poojaNames={POOJA_NAMES}
          recipientEstimateLabel={recipientEstimateLabel}
          onCancel={handleCancel}
          onStartEdit={() => setFormView(false)}
          onSaveDraft={handleSaveDraft}
          onSend={handleSend}
          onTitleChange={(v) => setFormField('title', v)}
          onDescriptionChange={(v) => setFormField('description', v)}
          onBannerToggle={(v) => setFormField('banner', v)}
          onBannerImageChange={handleBannerImageChange}
          onRemoveBannerImage={() => setFormField('bannerImage', null)}
          onPoojaChange={(v) => setFormField('poojaId', v)}
          onTargetChange={(v: NotificationAudience) => setFormField('target', v)}
          onToggleNakshatra={handleToggleNakshatra}
          onDeliveryChange={(v: NotificationDelivery) => setFormField('delivery', v)}
          onSchedDateChange={(v) => setFormField('schedDate', v)}
          onSchedTimeChange={(v) => setFormField('schedTime', v)}
        />
      )}

      <ConfirmNotificationModal
        open={confirm.open}
        title={confirmTitle}
        body={confirmBody}
        actionLabel={confirmActionLabel}
        onCancel={handleConfirmNo}
        onConfirm={handleConfirmYes}
      />

      <NotificationToast show={toast.show} message={toast.message} />
    </div>
  )
}
