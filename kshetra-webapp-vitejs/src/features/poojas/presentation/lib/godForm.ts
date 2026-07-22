import type { God, GodStatus } from '../../domain/entities/god'

/** Editable draft of a god. Sort order stays a string while typing. */
export interface GodFormState {
  name: string
  status: GodStatus
  sortOrder: string
  homeImage: string | null
  poojaImage: string | null
}

export interface GodFormErrors {
  name?: string
}

export function blankGodForm(nextSortOrder: number): GodFormState {
  return { name: '', status: 'Active', sortOrder: String(nextSortOrder), homeImage: null, poojaImage: null }
}

export function godToForm(g: God): GodFormState {
  return { name: g.name, status: g.status, sortOrder: String(g.sortOrder), homeImage: g.homeImage, poojaImage: g.poojaImage }
}

export function formToGod(form: GodFormState, id: string): God {
  return {
    id,
    name: form.name.trim(),
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
    homeImage: form.homeImage,
    poojaImage: form.poojaImage,
  }
}

export function validateGodForm(form: GodFormState): GodFormErrors {
  const errors: GodFormErrors = {}
  if (!form.name.trim()) errors.name = 'Enter a name.'
  return errors
}

export function godFormSignature(f: GodFormState): string {
  return JSON.stringify([f.name, f.homeImage, f.poojaImage, f.sortOrder, f.status])
}

/** Save-guard sentence shown when deactivating a previously-active god. */
export function godSaveGuardMessage(form: GodFormState, original: God): string | null {
  if (original.status === 'Active' && form.status === 'Inactive') {
    return `"${form.name.trim()}" stops appearing in the app for new bookings. Historical bookings, orders, and reports keep their existing data.`
  }
  return null
}
