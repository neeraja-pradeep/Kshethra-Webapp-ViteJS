import type { PoojaBlock } from '@/features/poojas/domain/entities/pooja'

/** The booking calendar for one pooja over a window. */
export interface PoojaAvailability {
  readonly start: string
  readonly end: string
  /** Block ranges expanded into individual days — what a calendar greys out. */
  readonly blockedDates: readonly string[]
  /** The same information unexpanded, for a client that would rather draw the span. */
  readonly blocks: readonly PoojaBlock[]
  /**
   * `null` for a regular pooja, which is bookable on any day not blocked —
   * enumerating those would just be the window minus `blockedDates`. For a
   * special pooja it is the finite list of published dates, blocked ones removed.
   */
  readonly bookableDates: readonly string[] | null
}
