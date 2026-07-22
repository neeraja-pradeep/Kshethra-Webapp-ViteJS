/** A product category — controls storefront grouping and app display order. */

export type CategoryStatus = 'Active' | 'Inactive'

export interface Category {
  readonly id: string
  readonly name: string
  /** 1-based display order in the app; lower appears first. */
  readonly sortOrder: number
  readonly status: CategoryStatus
}
