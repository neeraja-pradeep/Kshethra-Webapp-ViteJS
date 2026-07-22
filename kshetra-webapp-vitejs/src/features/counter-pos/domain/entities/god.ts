/** A deity that poojas are offered to; drives the "browse by god" filter. */

export type GodStatus = 'Active' | 'Inactive'

export interface God {
  readonly id: string
  readonly name: string
  readonly status: GodStatus
  readonly sortOrder: number
}
