/** A deity — master data every pooja references. */
export type GodStatus = 'Active' | 'Inactive'

export interface God {
  readonly id: string
  readonly name: string
  readonly status: GodStatus
  readonly sortOrder: number
  /** Home-screen artwork (data URI) or null when none uploaded yet. */
  readonly homeImage: string | null
  /** Pooja-screen artwork (data URI) or null. */
  readonly poojaImage: string | null
}
