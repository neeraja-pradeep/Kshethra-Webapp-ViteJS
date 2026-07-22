import type { Pooja, PoojaSchedule, PoojaStatus, SpecificDate, UnavailableRange } from '../../domain/entities/pooja'
import { todayISO } from './dateUtils'
import { blankSchedule } from './scheduleLogic'

/** Editable draft of a pooja. Numeric fields stay strings while typing (mirrors the empty-input state). */
export interface PoojaFormState {
  godIds: string[]
  name: string
  offlinePrice: string
  onlinePrice: string
  incentive: string
  status: PoojaStatus
  sortOrder: string
  special: boolean
  cardImage: string | null
  cardDesc: string
  bannerImage: string | null
  bannerDesc: string
  schedule: PoojaSchedule
  specificDates: SpecificDate[]
  unavailable: UnavailableRange[]
  specificDraft: string
  unavailStart: string
  unavailEnd: string
}

export interface PoojaFormErrors {
  name?: string
  godIds?: string
  offlinePrice?: string
  onlinePrice?: string
  incentive?: string
  schedule?: string
  specific?: string
  unavail?: string
}

/** A blank draft for "Add pooja", with the next display order pre-filled. */
export function blankPoojaForm(nextSortOrder: number): PoojaFormState {
  const today = todayISO()
  return {
    godIds: [],
    name: '',
    offlinePrice: '',
    onlinePrice: '',
    incentive: '',
    status: 'Active',
    sortOrder: String(nextSortOrder),
    special: false,
    cardImage: null,
    cardDesc: '',
    bannerImage: null,
    bannerDesc: '',
    schedule: blankSchedule(today),
    specificDates: [],
    unavailable: [],
    specificDraft: '',
    unavailStart: '',
    unavailEnd: '',
  }
}

/** Seed a draft from an existing pooja for editing. */
export function poojaToForm(p: Pooja): PoojaFormState {
  return {
    godIds: [...p.godIds],
    name: p.name,
    offlinePrice: String(p.offlinePrice),
    onlinePrice: String(p.onlinePrice),
    incentive: p.incentive != null ? String(p.incentive) : '',
    status: p.status,
    sortOrder: String(p.sortOrder),
    special: p.special,
    cardImage: p.cardImage,
    cardDesc: p.cardDesc,
    bannerImage: p.bannerImage,
    bannerDesc: p.bannerDesc,
    schedule: p.schedule ?? blankSchedule(todayISO()),
    specificDates: p.specificDates.map((d) => ({ ...d })),
    unavailable: p.unavailable.map((u) => ({ ...u })),
    specificDraft: '',
    unavailStart: '',
    unavailEnd: '',
  }
}

/** Build the saved record from a draft. `id` is reused when editing, generated when adding. */
export function formToPooja(form: PoojaFormState, id: string, godNameById: (id: string) => string): Pooja {
  return {
    id,
    godIds: [...form.godIds],
    godNames: form.godIds.map(godNameById),
    name: form.name.trim(),
    offlinePrice: Number(form.offlinePrice) || 0,
    onlinePrice: Number(form.onlinePrice) || 0,
    incentive: form.incentive !== '' ? Number(form.incentive) || 0 : undefined,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
    special: form.special,
    cardImage: form.special ? form.cardImage : null,
    cardDesc: form.special ? form.cardDesc : '',
    bannerImage: form.special ? form.bannerImage : null,
    bannerDesc: form.special ? form.bannerDesc : '',
    schedule: form.special ? { ...form.schedule } : null,
    specificDates: form.special ? form.specificDates.map((d) => ({ ...d })) : [],
    unavailable: form.unavailable.map((u) => ({ ...u })),
  }
}

/** Field validation, matching the design's save-time checks (required fields, non-negative prices, name+god clashes). */
export function validatePoojaForm(form: PoojaFormState, existingPoojas: readonly Pooja[], editingId: string | null, godNameById: (id: string) => string): PoojaFormErrors {
  const errors: PoojaFormErrors = {}
  const name = form.name.trim()
  if (!form.godIds.length) errors.godIds = 'Select at least one god.'
  if (!name) errors.name = 'Enter a pooja name.'
  if (Number(form.offlinePrice) < 0) errors.offlinePrice = 'Price can’t be negative.'
  if (Number(form.onlinePrice) < 0) errors.onlinePrice = 'Price can’t be negative.'
  if (Number(form.incentive) < 0) errors.incentive = 'Incentive can’t be negative.'

  if (name && form.godIds.length) {
    const clash: string[] = []
    existingPoojas.forEach((p) => {
      if (p.id === editingId) return
      if (p.name.trim().toLowerCase() !== name.toLowerCase()) return
      p.godIds.forEach((gid) => {
        if (form.godIds.includes(gid) && !clash.includes(gid)) clash.push(gid)
      })
    })
    if (clash.length) errors.godIds = 'This pooja name already exists for: ' + clash.map(godNameById).join(', ') + '.'
  }

  if (form.special) {
    const sc = form.schedule
    if (sc.endMode === 'after' && !(Number(sc.endCount) >= 1)) errors.schedule = 'End after must be at least 1 occurrence.'
    if (sc.endMode === 'on' && sc.endDate && sc.startDate && sc.endDate < sc.startDate)
      errors.schedule = 'Recurrence end date must be on or after the start date.'
    form.specificDates.forEach((d) => {
      if (Number(d.offlinePrice) < 0 || Number(d.onlinePrice) < 0 || Number(d.incentive) < 0) errors.specific = 'Specific-date prices can’t be negative.'
    })
  }

  return errors
}

/** Stable signature used to detect unsaved changes (discard-confirm) and duplicate-request avoidance. */
export function poojaFormSignature(f: PoojaFormState): string {
  return JSON.stringify([
    f.godIds,
    f.name,
    f.offlinePrice,
    f.onlinePrice,
    f.incentive,
    f.status,
    f.sortOrder,
    f.special,
    f.cardImage,
    f.cardDesc,
    f.bannerImage,
    f.bannerDesc,
    f.schedule,
    f.specificDates,
    f.unavailable,
  ])
}

/** Sentences shown in the "apply changes to future bookings" save-guard when editing changes something consequential. */
export function poojaSaveGuardMessages(form: PoojaFormState, original: Pooja): string[] {
  const msgs: string[] = []
  const priceChanged =
    Number(form.offlinePrice) !== Number(original.offlinePrice) ||
    Number(form.onlinePrice) !== Number(original.onlinePrice) ||
    (Number(form.incentive) || 0) !== (original.incentive || 0)
  if (priceChanged) msgs.push('Existing and advance bookings keep their booked price — the new price applies to future bookings only.')

  if (original.godIds.length > 1 && original.godIds.some((g) => !form.godIds.includes(g)))
    msgs.push('Removing a god does not affect existing bookings — the change applies to future bookings only.')

  const availabilityChanged =
    (form.special || original.special) &&
    (JSON.stringify(form.schedule ?? null) !== JSON.stringify(original.schedule ?? null) ||
      JSON.stringify(form.specificDates) !== JSON.stringify(original.specificDates) ||
      JSON.stringify(form.unavailable) !== JSON.stringify(original.unavailable))
  if (availabilityChanged) msgs.push('Bookings already made — including future dates — are unchanged; new availability applies to future bookings only.')

  if (original.status === 'Active' && form.status === 'Inactive')
    msgs.push('Deactivating hides it from new bookings; historical bookings, orders, and reports keep their existing data.')

  return msgs
}
