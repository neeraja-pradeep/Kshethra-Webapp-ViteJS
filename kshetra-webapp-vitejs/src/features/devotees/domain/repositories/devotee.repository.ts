import type { Result } from '@/core/error/result'
import type {
  Devotee,
  DevoteeDetail,
  DevoteeStatus,
  DevoteeSummary,
} from '@/features/devotees/domain/entities/devotee'

/**
 * Every filter here is applied by the server. Nothing is filtered client-side:
 * the list is paged, so narrowing one page would report a page total as if it
 * were the whole screen — and the search reaches things the table never prints
 * (a family member's name, a romanized spelling of a Malayalam one) that no
 * client-side match over the loaded rows could find.
 */
export interface DevoteeFilters {
  /**
   * Matches the account holder's name, username, email or phone, and the name
   * of any family profile they book for. A phone matches however it is
   * punctuated and with or without its country code; a Malayalam name also
   * matches its romanized spelling.
   */
  readonly search?: string
  readonly status?: DevoteeStatus
  /** A {@link DevoteeOrdering}, optionally `-` prefixed. Anything else is a 400. */
  readonly ordering?: string
  readonly page?: number
  /** Default 20, max 100 server-side. */
  readonly pageSize?: number
}

/**
 * The five sortable headers. `status` sorts on a derived value rather than on
 * `is_active`, so ascending puts Active first the way the two printed words
 * sort — ordering on the boolean would make one click do the opposite of what
 * the arrow says.
 */
export type DevoteeOrdering = 'name' | 'family' | 'bookings' | 'last_activity' | 'status'

/** A page of the table, plus counts over the whole searched set. */
export interface DevoteePage {
  readonly count: number
  readonly results: readonly Devotee[]
  readonly summary: DevoteeSummary
}

export interface DevoteeRepository {
  fetchDevotees(filters?: DevoteeFilters): Promise<Result<DevoteePage>>
  /** One account, with the family and bookings behind its two count columns. */
  fetchDevotee(id: number): Promise<Result<DevoteeDetail>>
  /**
   * Suspends or reinstates an account. Revokes sign-in and nothing else — the
   * family profiles, bookings and receipts all stay where they are. Idempotent,
   * and returns the row in the shape the table renders.
   */
  setDevoteeStatus(id: number, status: DevoteeStatus): Promise<Result<Devotee>>
}
