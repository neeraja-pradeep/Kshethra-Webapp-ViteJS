import type { Result } from '@/core/error/result'
import type { PoojaAvailability } from '@/features/poojas/domain/entities/pooja-availability'
import type {
  Pooja,
  PoojaBlock,
  PoojasSummary,
  PoojaStatus,
} from '@/features/poojas/domain/entities/pooja'

/**
 * `?ordering=` accepts only these, and an unknown value is a `400` rather than
 * being quietly ignored — so the type is closed.
 */
export type PoojaOrderingField =
  'name' | 'offline_price' | 'online_price' | 'poojari_incentive' | 'status' | 'sort_order' | 'id'
export type PoojaOrdering = PoojaOrderingField | `-${PoojaOrderingField}`

/**
 * Everything here is applied server-side. Nothing is filtered, sorted or sliced
 * in the browser: the summary tiles are counted over the whole filtered
 * catalogue, which a client holding one page could not reproduce.
 */
export interface PoojaFilters {
  /** Pooja name, a god's name, or an id. Romanized, so `haridra homam` finds the Malayalam. */
  readonly search?: string
  readonly status?: boolean
  readonly special?: boolean
  /** `true` selects `poojari_incentive > 0`, `false` selects zero. */
  readonly hasIncentive?: boolean
  /** Matches **any** of a pooja's gods, not just the primary one. */
  readonly god?: number
  readonly ordering?: PoojaOrdering
  readonly page?: number
  readonly pageSize?: number
}

export interface PoojaPage {
  readonly count: number
  readonly results: readonly Pooja[]
  readonly summary: PoojasSummary
}

/** One block as the form sends it. `endDate` omitted blocks the single day. */
export interface PoojaBlockWrite {
  readonly startDate: string
  readonly endDate?: string
  readonly reason?: string
}

/** One published date as the form sends it. */
export interface SpecialPoojaDateWrite {
  readonly date: string
  readonly time?: string
  readonly onlinePrice?: number
  readonly offlinePrice?: number
  readonly banner?: boolean
}

/** What the *Add pooja* / *Edit pooja* form can write. */
export interface PoojaWrite {
  readonly name: string
  /** Ordered; position 0 is the primary god. An empty list is refused. */
  readonly godIds?: readonly number[]
  readonly offlinePrice?: number
  readonly onlinePrice?: number
  readonly poojariIncentive?: number
  readonly status?: PoojaStatus
  readonly special?: boolean
  readonly sortOrder?: number
  readonly bannerDesc?: string
  readonly cardDesc?: string
  readonly captionsDesc?: string
  /**
   * A new picture to upload, or `null` to clear it. `undefined` leaves it
   * alone — which is the difference between "no change" and "remove".
   */
  readonly media?: File | null
  readonly banner?: File | null
  /**
   * The **complete** blocks card. On save it is reconciled to exactly what was
   * sent: blocks not in the list are lifted. Omit the key to leave them alone;
   * send `[]` to clear them.
   */
  readonly unavailableDates?: readonly PoojaBlockWrite[]
  /**
   * Additive. Dates already on the pooja that this list does not mention are
   * left standing — a published date can have orders against it, and removing
   * one silently would cancel bookings as a side effect of an edit.
   */
  readonly specialPoojaDates?: readonly SpecialPoojaDateWrite[]
}

/** A write that partly succeeded — the pooja saved, its artwork did not. */
export interface PoojaSaveOutcome {
  readonly pooja: Pooja
  /** User-safe sentence when the image step failed, else `null`. */
  readonly imageError: string | null
}

export interface BulkStatusOutcome {
  readonly message: string
  readonly updatedCount: number
  readonly notFound: readonly number[]
}

export interface BulkDeleteSkip {
  readonly id: number
  readonly name: string
  readonly reason: string
}

export interface BulkDeleteOutcome {
  readonly message: string
  readonly deletedCount: number
  /** Named refusals — one booked pooja does not block the rest of the selection. */
  readonly skipped: readonly BulkDeleteSkip[]
  readonly notFound: readonly number[]
}

export interface PoojaImportError {
  /** The line number as the spreadsheet shows it — the header is row 1. */
  readonly row: number
  readonly column: string
  readonly value: string
  readonly error: string
}

export interface PoojaImportOutcome {
  readonly message: string
  readonly totalRows: number
  readonly createdCount: number
  readonly failedCount: number
  readonly errors: readonly PoojaImportError[]
}

export interface PoojaRepository {
  fetchPoojas(filters?: PoojaFilters): Promise<Result<PoojaPage>>
  fetchPooja(id: number): Promise<Result<Pooja>>
  /**
   * Saves the whole form.
   *
   * The nested cards are lists of objects, which multipart cannot carry
   * cleanly, so the scalars and the lists go as JSON and any artwork follows in
   * a second multipart call. That ordering is what lets *Add pooja* work at
   * all: both cards sit on a pooja that does not exist yet, and the server runs
   * them as one transaction. If the image step is the one that fails, the pooja
   * is still saved — hence `PoojaSaveOutcome` rather than a bare failure.
   */
  createPooja(input: PoojaWrite): Promise<Result<PoojaSaveOutcome>>
  updatePooja(id: number, input: Partial<PoojaWrite>): Promise<Result<PoojaSaveOutcome>>
  /** Refused with a `403` when any order line references the pooja. */
  deletePooja(id: number): Promise<Result<void>>
  setPoojaStatus(id: number, status: PoojaStatus): Promise<Result<Pooja>>
  /** The copy is created inactive, without images, published dates or blocks. */
  duplicatePooja(id: number, name?: string): Promise<Result<Pooja>>
  bulkSetPoojaStatus(
    ids: readonly number[],
    status: PoojaStatus,
  ): Promise<Result<BulkStatusOutcome>>
  bulkDeletePoojas(ids: readonly number[]): Promise<Result<BulkDeleteOutcome>>
  /**
   * The read-only calendar. Asks for `view_pooja`, unlike the blocks
   * sub-resource, which is gated at `change_pooja` for its `GET` as well as its
   * `POST` — so this is the one a viewer-role operator can call.
   */
  fetchAvailability(id: number, start?: string, end?: string): Promise<Result<PoojaAvailability>>
  blockDates(id: number, block: PoojaBlockWrite): Promise<Result<PoojaBlock>>
  unblockDates(id: number, blockId: number): Promise<Result<void>>
  importPoojas(file: File): Promise<Result<PoojaImportOutcome>>
}
