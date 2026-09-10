import { useEffect, useMemo, useRef, useState } from 'react'

import { toFailure } from '@/core/error/result'
import { Alert, Button, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'

import {
  useCreateTempleLocationMutation,
  useDeleteTempleLocationMutation,
  useUpdateTempleLocationMutation,
} from '@/features/temple-locations/application/queries/useTempleLocationMutations'
import { useTempleLocationsQuery } from '@/features/temple-locations/application/queries/useTempleLocationQueries'
import type {
  TempleLocation,
  TempleLocationWrite,
} from '@/features/temple-locations/domain/entities/temple-location'
import { readGeofenceReadiness } from '@/features/temple-locations/domain/entities/temple-location'
import { GeofenceReadinessBanner } from '@/features/temple-locations/presentation/components/GeofenceReadinessBanner'
import { TempleLocationDeleteModal } from '@/features/temple-locations/presentation/components/TempleLocationDeleteModal'
import { TempleLocationFormModal } from '@/features/temple-locations/presentation/components/TempleLocationFormModal'
import { TempleLocationToast } from '@/features/temple-locations/presentation/components/TempleLocationToast'
import { TempleLocationsTable } from '@/features/temple-locations/presentation/components/TempleLocationsTable'
import {
  blankTempleLocationForm,
  validateTempleLocationForm,
  type TempleLocationFormErrors,
  type TempleLocationFormValues,
} from '@/features/temple-locations/presentation/lib/templeLocationDisplay'

const TOAST_MS = 2400
/**
 * One page, large enough to be the whole set in practice.
 *
 * A temple has a handful of sites, and the readiness banner has to reason over
 * **every** active one — counting a page would tell an operator the geofence
 * was fine while a second active site sat on page two.
 */
const PAGE_SIZE = 100

/** Which wire field an error belongs to, for mapping the server's 400 back onto the form. */
const FIELD_BY_WIRE_KEY: Readonly<Record<string, keyof TempleLocationFormValues>> = {
  name: 'name',
  latitude: 'latitude',
  longitude: 'longitude',
  radius_meters: 'radiusMeters',
  is_active: 'isActive',
}

/**
 * App &gt; Temple location — the attendance geofence. Route: `/temple-location`.
 *
 * A poojari marking "present" must be inside one of these circles, and the
 * radius is the only dial: widening it here is how the office answers "the GPS
 * will not let me mark" without waiting for a mobile release.
 *
 * The list is deliberately unfiltered and unsorted — the server offers neither,
 * and a temple has few enough sites that inventing client-side filtering would
 * only risk narrowing a page while claiming to narrow the set.
 */
export function TempleLocationsScreen() {
  const can = useCan()
  const canWrite = can(PERMISSIONS.changeTempleLocation)
  const canCreate = can(PERMISSIONS.addTempleLocation)
  const canDelete = can(PERMISSIONS.deleteTempleLocation)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TempleLocationFormValues>(blankTempleLocationForm)
  const [localErrors, setLocalErrors] = useState<TempleLocationFormErrors>({})
  const [deleting, setDeleting] = useState<TempleLocation | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationsQuery = useTempleLocationsQuery({ pageSize: PAGE_SIZE })
  const createLocation = useCreateTempleLocationMutation()
  const updateLocation = useUpdateTempleLocationMutation()
  const deleteLocation = useDeleteTempleLocationMutation()

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function showToast(message: string) {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  const rows = useMemo(() => locationsQuery.data?.results ?? [], [locationsQuery.data])
  const readiness = useMemo(() => readGeofenceReadiness(rows), [rows])
  const activeCount = useMemo(() => rows.filter((row) => row.isActive).length, [rows])

  function openCreate() {
    setEditingId(null)
    setForm(blankTempleLocationForm())
    setLocalErrors({})
    createLocation.reset()
    updateLocation.reset()
    setFormOpen(true)
  }

  function openEdit(row: TempleLocation) {
    setEditingId(row.id)
    setForm({
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      radiusMeters: String(row.radiusMeters),
      isActive: row.isActive,
    })
    setLocalErrors({})
    createLocation.reset()
    updateLocation.reset()
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setLocalErrors({})
  }

  function handleSubmit() {
    const errors = validateTempleLocationForm(form)
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors)
      return
    }
    setLocalErrors({})

    const input: TempleLocationWrite = {
      name: form.name.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      radiusMeters: Number(form.radiusMeters),
      isActive: form.isActive,
    }

    if (editingId === null) {
      createLocation.mutate(input, {
        onSuccess: () => {
          closeForm()
          showToast('Site added')
        },
      })
      return
    }
    updateLocation.mutate(
      { id: editingId, input },
      {
        onSuccess: () => {
          closeForm()
          showToast('Site updated')
        },
      },
    )
  }

  /** The row switch. A one-field PATCH, so nothing else on the row can move. */
  function handleToggleActive(row: TempleLocation) {
    updateLocation.mutate(
      { id: row.id, input: { isActive: !row.isActive } },
      { onSuccess: () => showToast(row.isActive ? 'Site deactivated' : 'Site activated') },
    )
  }

  function handleDeactivateInstead() {
    if (!deleting) return
    const row = deleting
    setDeleting(null)
    updateLocation.mutate(
      { id: row.id, input: { isActive: false } },
      { onSuccess: () => showToast('Site deactivated') },
    )
  }

  function handleConfirmDelete() {
    if (!deleting) return
    deleteLocation.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null)
        showToast('Site deleted')
      },
    })
  }

  const writeFailure = toFailure(createLocation.error) ?? toFailure(updateLocation.error)
  /** The server's field errors beat the local ones — it is the authority. */
  const serverFieldErrors = useMemo<TempleLocationFormErrors>(() => {
    if (writeFailure?.kind !== 'validation') return {}
    const mapped: TempleLocationFormErrors = {}
    for (const [wireKey, messages] of Object.entries(writeFailure.fieldErrors ?? {})) {
      const field = FIELD_BY_WIRE_KEY[wireKey]
      const message = messages?.[0]
      if (field && message) mapped[field] = message
    }
    return mapped
  }, [writeFailure])

  const formErrors: TempleLocationFormErrors = { ...localErrors, ...serverFieldErrors }
  const formBanner =
    writeFailure && writeFailure.kind !== 'validation'
      ? (writeFailure.message ?? 'The site could not be saved.')
      : null

  const listFailure = locationsQuery.isError
    ? (toFailure(locationsQuery.error)?.message ?? 'Attendance locations could not be loaded.')
    : null
  const deleteFailure = deleteLocation.isError
    ? (toFailure(deleteLocation.error)?.message ?? 'The site could not be deleted.')
    : null
  /** A toggle failure has no modal of its own to land in. */
  const toggleFailure =
    !formOpen && updateLocation.isError
      ? (toFailure(updateLocation.error)?.message ?? 'The site could not be updated.')
      : null

  const empty = (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <Icon name="map-pin" size={28} className="text-ink-subtle" />
      <span className="text-sm font-medium text-ink-strong">No attendance sites yet</span>
      <span className="max-w-sm text-xs text-ink-subtle">
        Add the temple&rsquo;s premises so poojaris can mark attendance from it.
      </span>
    </div>
  )

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">
            Temple location
          </h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">
            Where poojaris may mark attendance from, and how far the geofence reaches.
          </p>
        </div>
        {/* Hidden rather than disabled for a read-only role — the API would 403. */}
        {canCreate && (
          <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={openCreate}>
            Add site
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-7 pb-6">
        {!locationsQuery.isPending && !listFailure && <GeofenceReadinessBanner readiness={readiness} />}

        {(listFailure || deleteFailure || toggleFailure) && (
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {listFailure ?? deleteFailure ?? toggleFailure}
          </Alert>
        )}

        {locationsQuery.isPending ? (
          <div className="flex min-h-60 flex-1 items-center justify-center">
            <Spinner size={40} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card shadow-xs">
            <TempleLocationsTable
              rows={rows}
              canWrite={canWrite}
              canDelete={canDelete}
              onRowClick={canWrite ? openEdit : () => {}}
              onToggleActive={handleToggleActive}
              onDelete={setDeleting}
              empty={empty}
            />
          </div>
        )}

        {canDelete && rows.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <Icon name="info" size={14} />
            <span>
              Prefer deactivating over deleting — a deleted site clears every poojari&rsquo;s
              assignment to it.
            </span>
          </div>
        )}
      </div>

      <TempleLocationFormModal
        open={formOpen}
        editing={editingId !== null}
        values={form}
        errors={formErrors}
        banner={formBanner}
        saving={createLocation.isPending || updateLocation.isPending}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <TempleLocationDeleteModal
        open={deleting !== null}
        name={deleting?.name ?? ''}
        isLastActive={deleting?.isActive === true && activeCount === 1}
        deleting={deleteLocation.isPending}
        error={deleteFailure}
        onConfirm={handleConfirmDelete}
        onDeactivateInstead={handleDeactivateInstead}
        onCancel={() => setDeleting(null)}
      />

      <TempleLocationToast show={toast.show} message={toast.message} />
    </div>
  )
}
