/** A deity that poojas are offered to; drives the "browse by god" filter. */

export type GodStatus = 'Active' | 'Inactive'

export interface God {
  readonly id: number
  readonly name: string
  readonly status: GodStatus
  readonly sortOrder: number
  /**
   * How many poojas the catalogue holds for this god. The till hides a god with
   * none: its chip could only ever lead to an empty list, and a dead end on a
   * filter reads as a fault in the till rather than an empty shrine.
   */
  readonly poojasCount: number
}
