/** Domain types for the Agent code feature. Plain data — no logic, no React. */

/**
 * The admin's switch — whether the code may be redeemed at all.
 *
 * Independent of {@link AgentCodeValidityState}: a code held on for next year's
 * festival is `active` **and** `expired` at the same time. Never derive one from
 * the other. The server also carries a legacy `expired` status on old rows, but
 * never writes it and will not accept it as input.
 */
export type AgentCodeStatus = 'active' | 'inactive'

/** Derived from the window and the clock, never stored. */
export type AgentCodeValidityState = 'active' | 'scheduled' | 'expired'

/**
 * A code devotees apply in the app so a booking becomes payable at the
 * temple counter instead of online.
 */
export interface AgentCode {
  readonly id: number
  /** Short code the devotee types in the app. Always stored upper-case. */
  readonly code: string
  /** `''` when unset — never null. */
  readonly description: string
  /** ISO datetime in the temple's local offset, or `null` for "always open". */
  readonly validFrom: string | null
  /** ISO datetime in the temple's local offset, or `null` for "never closes". */
  readonly validTo: string | null
  readonly validityState: AgentCodeValidityState
  /** Non-cancelled bookings against the code. A cancelled booking is not a use. */
  readonly uses: number
  /** `null` is the `∞` the USES column prints — **not** zero. */
  readonly usageLimit: number | null
  /** Sum of those bookings' totals. */
  readonly orderValue: number
  readonly status: AgentCodeStatus
}

/** One booking placed under a code, as the detail page's usage card lists it. */
export interface AgentCodeUsageBooking {
  readonly orderId: number
  /** The reference the rest of the back office prints, e.g. `PO-14`. */
  readonly orderRef: string
  readonly devotee: string
  /** Already truncated server-side to two names plus `+N more`. */
  readonly poojaSummary: string
  readonly poojaCount: number
  /** The **first** pooja date on the order, or `null` if none. */
  readonly date: string | null
  readonly amount: number
  /** `false` is the *At counter* chip — the normal state for these bookings. */
  readonly paid: boolean
  readonly status: string
}

/**
 * The usage card.
 *
 * `bookings` is capped at the 50 most recent, while the two totals are counted
 * in the database over every non-cancelled booking — so **never derive the
 * tiles from the list**. Past 50 uses the two part company and `hasMore` goes
 * true.
 */
export interface AgentCodeUsage {
  readonly timesUsed: number
  readonly totalOrderValue: number
  readonly bookings: readonly AgentCodeUsageBooking[]
  readonly hasMore: boolean
}

/** The code's own page: the row, plus what only the detail screen draws. */
export interface AgentCodeDetail extends AgentCode {
  /** UTC with a `Z`, unlike the two window dates. */
  readonly createdAt: string
  readonly usage: AgentCodeUsage
  /**
   * Drives the delete card. False shows the "deactivate instead" note — and can
   * be false while `timesUsed` is 0, when a devotee holds the code in a live
   * cart right now.
   */
  readonly deletable: boolean
  readonly activeCarts: number
}

/** The three tiles above the table. */
export interface AgentCodeSummary {
  readonly total: number
  readonly active: number
  readonly inactive: number
}

/** A page of the table, plus the counts the tiles read. */
export interface AgentCodePage {
  readonly count: number
  readonly results: readonly AgentCode[]
  /**
   * Counted over `search` and `validity` but **deliberately not over
   * `status`** — a tile is how that filter is applied, so counting it into its
   * own total would zero the other two on the first click. Render the tiles
   * from here, never from `results.length`.
   */
  readonly summary: AgentCodeSummary
}

/** What the create and edit forms write. */
export interface AgentCodeWrite {
  readonly code?: string
  readonly description?: string
  /**
   * `null` clears, **absent leaves alone**. A cleared field on the edit form
   * must be sent as an explicit null or clearing it silently does nothing.
   */
  readonly validFrom?: string | null
  readonly validTo?: string | null
  /** `0` is stored as `null` server-side, not as a ceiling of none. */
  readonly usageLimit?: number | null
  readonly status?: AgentCodeStatus
}
