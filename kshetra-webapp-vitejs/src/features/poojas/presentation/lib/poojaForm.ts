import type { Pooja, PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type {
  PoojaBlockWrite,
  PoojaWrite,
  SpecialPoojaDateWrite,
} from '@/features/poojas/domain/repositories/pooja.repository'

/** A published date as the form holds it. Prices stay strings while typing. */
export interface SpecialDateDraft {
  /** Server id when the date is already published, `null` while it is new. */
  readonly id: number | null
  date: string
  time: string
  offlinePrice: string
  onlinePrice: string
  banner: boolean
}

/** A block as the form holds it. `id` is null until the save creates it. */
export interface BlockDraft {
  readonly id: number | null
  startDate: string
  endDate: string
  reason: string
}

/**
 * Editable draft of a pooja. Numeric fields stay strings while typing, which
 * is what lets an input be empty rather than snapping to `0`.
 *
 * Each picture is two fields: the URL already stored, and the pending change.
 * `undefined` means untouched, a `File` means upload this, `null` means clear —
 * the three states the API distinguishes.
 */
export interface PoojaFormState {
  name: string
  godIds: number[]
  offlinePrice: string
  onlinePrice: string
  incentive: string
  status: PoojaStatus
  sortOrder: string
  special: boolean
  cardDesc: string
  bannerDesc: string
  captionsDesc: string
  readonly mediaUrl: string | null
  readonly bannerUrl: string | null
  media?: File | null
  banner?: File | null
  specialDates: SpecialDateDraft[]
  blocks: BlockDraft[]
  /** Scratch fields for the two "add a row" controls. */
  specificDraft: string
  blockStart: string
  blockEnd: string
  blockReason: string
}

export interface PoojaFormErrors {
  name?: string
  godIds?: string
  offlinePrice?: string
  onlinePrice?: string
  incentive?: string
  specific?: string
  block?: string
}

export function blankPoojaForm(nextSortOrder: number): PoojaFormState {
  return {
    name: '',
    godIds: [],
    offlinePrice: '',
    onlinePrice: '',
    incentive: '',
    status: 'Active',
    sortOrder: String(nextSortOrder),
    special: false,
    cardDesc: '',
    bannerDesc: '',
    captionsDesc: '',
    mediaUrl: null,
    bannerUrl: null,
    specialDates: [],
    blocks: [],
    specificDraft: '',
    blockStart: '',
    blockEnd: '',
    blockReason: '',
  }
}

export function poojaToForm(pooja: Pooja): PoojaFormState {
  return {
    name: pooja.name,
    godIds: [...pooja.godIds],
    offlinePrice: String(pooja.offlinePrice),
    onlinePrice: String(pooja.onlinePrice),
    incentive: pooja.poojariIncentive ? String(pooja.poojariIncentive) : '',
    status: pooja.status,
    sortOrder: String(pooja.sortOrder),
    special: pooja.special,
    cardDesc: pooja.cardDesc,
    bannerDesc: pooja.bannerDesc,
    captionsDesc: pooja.captionsDesc,
    mediaUrl: pooja.mediaUrl,
    bannerUrl: pooja.bannerUrl,
    specialDates: pooja.specialPoojaDates.map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
      offlinePrice: d.offlinePrice == null ? '' : String(d.offlinePrice),
      onlinePrice: d.onlinePrice == null ? '' : String(d.onlinePrice),
      banner: d.banner,
    })),
    blocks: pooja.unavailableDates.map((b) => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      reason: b.reason,
    })),
    specificDraft: '',
    blockStart: '',
    blockEnd: '',
    blockReason: '',
  }
}

/** What to show in a slot: the pending file's preview, else the stored URL, else nothing. */
export function shownImage(
  pending: File | null | undefined,
  storedUrl: string | null,
  previewUrl: string | null,
): string | null {
  if (pending instanceof File) return previewUrl
  if (pending === null) return null
  return storedUrl
}

function toBlockWrites(form: PoojaFormState): readonly PoojaBlockWrite[] {
  return form.blocks.map((b) => ({
    startDate: b.startDate,
    ...(b.endDate && b.endDate !== b.startDate ? { endDate: b.endDate } : {}),
    ...(b.reason ? { reason: b.reason } : {}),
  }))
}

function toSpecialDateWrites(form: PoojaFormState): readonly SpecialPoojaDateWrite[] {
  return form.specialDates.map((d) => ({
    date: d.date,
    ...(d.time ? { time: d.time } : {}),
    ...(d.offlinePrice !== '' ? { offlinePrice: Number(d.offlinePrice) } : {}),
    ...(d.onlinePrice !== '' ? { onlinePrice: Number(d.onlinePrice) } : {}),
    banner: d.banner,
  }))
}

/**
 * The draft as the API's write model.
 *
 * Untouched pictures are omitted, not nulled. `unavailableDates` is always sent
 * because the server reconciles it to exactly what it receives — omitting it
 * would mean "leave the blocks alone", which is not what a form that shows them
 * means when a row was removed.
 *
 * Known limitation: the pooja payload carries only blocks that have **not yet
 * passed**, so a save reconciles against the future ones and lifts any expired
 * block along with its history. Nothing bookable changes — those days are in
 * the past — but the record of them goes. Fixing it needs the blocks read
 * (`?include_past=true`), which is gated at `change_pooja`; see
 * `docs/api/pooja-management-gaps.md` §F.
 */
export function toPoojaWrite(form: PoojaFormState): PoojaWrite {
  const specialDates = toSpecialDateWrites(form)
  return {
    name: form.name.trim(),
    godIds: [...form.godIds],
    offlinePrice: Number(form.offlinePrice) || 0,
    onlinePrice: Number(form.onlinePrice) || 0,
    poojariIncentive: form.incentive === '' ? 0 : Number(form.incentive) || 0,
    status: form.status,
    special: form.special,
    sortOrder: Number(form.sortOrder) || 0,
    cardDesc: form.special ? form.cardDesc : '',
    bannerDesc: form.special ? form.bannerDesc : '',
    captionsDesc: form.special ? form.captionsDesc : '',
    ...(form.media !== undefined ? { media: form.media } : {}),
    ...(form.banner !== undefined ? { banner: form.banner } : {}),
    unavailableDates: toBlockWrites(form),
    // Additive on the server, and only meaningful for a special pooja.
    ...(form.special && specialDates.length ? { specialPoojaDates: specialDates } : {}),
  }
}

/** Field validation. The catalogue-wide name clash is the server's call, not ours. */
export function validatePoojaForm(form: PoojaFormState): PoojaFormErrors {
  const errors: PoojaFormErrors = {}
  if (!form.godIds.length) errors.godIds = 'Select at least one god.'
  if (!form.name.trim()) errors.name = 'Enter a pooja name.'

  // Both prices are required. Left blank they would be written as `0.00`,
  // publishing a pooja that is bookable for nothing.
  if (form.offlinePrice.trim() === '') errors.offlinePrice = 'Enter the counter price.'
  else if (Number.isNaN(Number(form.offlinePrice))) errors.offlinePrice = 'Enter a number.'
  else if (Number(form.offlinePrice) < 0) errors.offlinePrice = 'Price can’t be negative.'

  if (form.onlinePrice.trim() === '') errors.onlinePrice = 'Enter the app price.'
  else if (Number.isNaN(Number(form.onlinePrice))) errors.onlinePrice = 'Enter a number.'
  else if (Number(form.onlinePrice) < 0) errors.onlinePrice = 'Price can’t be negative.'

  // The incentive is genuinely optional — blank means zero, which is "none".
  if (form.incentive.trim() !== '' && Number(form.incentive) < 0) {
    errors.incentive = 'Incentive can’t be negative.'
  }

  if (form.specialDates.some((d) => Number(d.offlinePrice) < 0 || Number(d.onlinePrice) < 0)) {
    errors.specific = 'Specific-date prices can’t be negative.'
  }
  if (form.blocks.some((b) => b.endDate && b.endDate < b.startDate)) {
    errors.block = 'A block’s end date must be on or after its start date.'
  }
  return errors
}

/** Stable signature used to detect unsaved changes (the discard-confirm). */
export function poojaFormSignature(form: PoojaFormState): string {
  const picture = (pending: File | null | undefined) =>
    pending === undefined ? 'keep' : (pending?.name ?? 'clear')
  return JSON.stringify([
    form.name,
    form.godIds,
    form.offlinePrice,
    form.onlinePrice,
    form.incentive,
    form.status,
    form.sortOrder,
    form.special,
    form.cardDesc,
    form.bannerDesc,
    form.captionsDesc,
    picture(form.media),
    picture(form.banner),
    form.specialDates,
    form.blocks,
  ])
}

/** Sentences shown in the "apply changes to future bookings" save-guard. */
export function poojaSaveGuardMessages(form: PoojaFormState, original: Pooja): string[] {
  const messages: string[] = []

  const priceChanged =
    Number(form.offlinePrice) !== original.offlinePrice ||
    Number(form.onlinePrice) !== original.onlinePrice ||
    (Number(form.incentive) || 0) !== original.poojariIncentive
  if (priceChanged) {
    messages.push(
      'Existing and advance bookings keep the price and incentive they were booked at — the new figures apply to future bookings only.',
    )
  }

  if (original.godIds.length > 1 && original.godIds.some((id) => !form.godIds.includes(id))) {
    messages.push(
      'Removing a god does not affect existing bookings — the change applies to future bookings only.',
    )
  }

  const blocksChanged = JSON.stringify(form.blocks) !== JSON.stringify(poojaToForm(original).blocks)
  if (blocksChanged) {
    messages.push(
      'Blocking a date hides it from new bookings; bookings already taken on it are not cancelled and must be handled from the order.',
    )
  }

  if (original.status === 'Active' && form.status === 'Inactive') {
    messages.push(
      'Deactivating hides it from new bookings; historical bookings, orders and reports keep their existing data.',
    )
  }

  return messages
}
