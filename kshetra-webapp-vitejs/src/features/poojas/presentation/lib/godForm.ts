import type { God, GodStatus } from '@/features/poojas/domain/entities/god'
import type { GodWrite } from '@/features/poojas/domain/repositories/god.repository'

/**
 * Editable draft of a god. Sort order stays a string while typing.
 *
 * Each picture is two fields: the URL already stored, and the pending change.
 * A pending change of `undefined` means untouched, a `File` means upload this,
 * and `null` means clear it — the same three states the API distinguishes, so
 * a rename can never quietly drop the artwork.
 */
export interface GodFormState {
  name: string
  status: GodStatus
  sortOrder: string
  readonly homeMediaUrl: string | null
  readonly mediaUrl: string | null
  homeMedia?: File | null
  media?: File | null
}

export interface GodFormErrors {
  name?: string
}

/** A blank draft for "Add god", with the server's next display order pre-filled. */
export function blankGodForm(nextSortOrder: number): GodFormState {
  return {
    name: '',
    status: 'Active',
    sortOrder: String(nextSortOrder),
    homeMediaUrl: null,
    mediaUrl: null,
  }
}

export function godToForm(god: God): GodFormState {
  return {
    name: god.name,
    status: god.status,
    sortOrder: String(god.sortOrder),
    homeMediaUrl: god.homeMediaUrl,
    mediaUrl: god.mediaUrl,
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

/** The draft as the API's write model. Untouched pictures are omitted, not nulled. */
export function toGodWrite(form: GodFormState): GodWrite {
  return {
    name: form.name.trim(),
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
    ...(form.media !== undefined ? { media: form.media } : {}),
    ...(form.homeMedia !== undefined ? { homeMedia: form.homeMedia } : {}),
  }
}

export function validateGodForm(form: GodFormState): GodFormErrors {
  const errors: GodFormErrors = {}
  if (!form.name.trim()) errors.name = 'Enter a name.'
  return errors
}

/** Stable signature used to detect unsaved changes (the discard-confirm). */
export function godFormSignature(form: GodFormState): string {
  const picture = (pending: File | null | undefined) =>
    pending === undefined ? 'keep' : (pending?.name ?? 'clear')
  return JSON.stringify([
    form.name,
    form.status,
    form.sortOrder,
    picture(form.homeMedia),
    picture(form.media),
  ])
}

/** Save-guard sentence shown when deactivating a previously-active god. */
export function godSaveGuardMessage(form: GodFormState, original: God): string | null {
  if (original.status === 'Active' && form.status === 'Inactive') {
    return `"${form.name.trim()}" stops appearing in the app as an entry point. Its poojas stay active and bookable, and historical bookings, orders and reports keep their existing data.`
  }
  return null
}
