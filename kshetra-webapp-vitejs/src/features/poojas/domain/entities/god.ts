/**
 * A deity — master data every pooja references.
 *
 * The screen says God; the model is a `PoojaCategory` and the route is
 * `booking/poojacategory/`. Same rows, older name: the table predates the
 * screen and every pooja, order and report already points at it.
 */

export type GodStatus = 'Active' | 'Inactive'

export interface God {
  readonly id: number
  readonly name: string
  /**
   * How many poojas reference this god, counted **once** whether it is their
   * primary god or one of several. It is the same figure the delete guard
   * uses, so the column and the "in use by N poojas" refusal cannot disagree.
   */
  readonly poojasCount: number
  /** "Pooja image" — the artwork on the pooja screen. */
  readonly mediaUrl: string | null
  /** "Home screen image" — the app's home tile. */
  readonly homeMediaUrl: string | null
  readonly status: GodStatus
  /** Lower appears first; ties break by id. Assigned by the server on reorder. */
  readonly sortOrder: number
}

/** Counted over the filters, never over the page. */
export interface GodsSummary {
  readonly total: number
  readonly active: number
  readonly inactive: number
  /**
   * What *Display order* pre-fills with. Deliberately **not** filtered: a new
   * god goes to the end of the list, not the end of a search result.
   */
  readonly nextSortOrder: number
}

/** The wire wants a boolean; the screen wants a word. */
export function godIsActive(status: GodStatus): boolean {
  return status === 'Active'
}

export function godStatusFromActive(isActive: boolean): GodStatus {
  return isActive ? 'Active' : 'Inactive'
}
