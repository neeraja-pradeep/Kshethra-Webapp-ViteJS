/**
 * A shop category.
 *
 * Categories are the app's store navigation, and **the order they are in here
 * is the order a devotee sees** — which is why the admin screen is a
 * drag-to-reorder list rather than a table with a sort control, and why
 * `sortOrder` is assigned by the server rather than typed in.
 */

export type CategoryStatus = 'active' | 'inactive'

export interface Category {
  readonly id: number
  readonly name: string
  /** Nesting is supported by the API; the admin screen is flat and ignores it. */
  readonly parent: number | null
  /**
   * Switched off, **not** deleted: an inactive category keeps its products, its
   * name and its place in the order. The app hides it; the back office does not.
   */
  readonly status: CategoryStatus
  /**
   * Every product in it, whatever that product's own status — which is what
   * makes this column add up to the products screen's total.
   * Direct products only; a parent does not absorb its children's.
   */
  readonly productCount: number
  /** Lower first. Assigned by the server — the client never computes one. */
  readonly sortOrder: number
  /**
   * Letters the SKUs in this category start with — `LMP` for `LMP-001`.
   * Stored rather than derived, because the codes a temple already prints on
   * its shelf labels follow no rule anything could infer. Blank derives a
   * starting point from the name.
   */
  readonly skuPrefix: string
  /** Read-only. The highest SKU number ever issued here — numbers are never reused. */
  readonly skuSequence: number
  readonly mediaUrl: string | null
  readonly mediaPublicId: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export const CATEGORY_STATUSES: readonly CategoryStatus[] = ['active', 'inactive']

const STATUS_LABELS: Record<CategoryStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export function categoryStatusLabel(status: CategoryStatus): string {
  return STATUS_LABELS[status]
}
