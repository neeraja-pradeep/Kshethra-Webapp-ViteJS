import type { Result } from '@/core/error/result'
import type { God, GodsSummary, GodStatus } from '@/features/poojas/domain/entities/god'

/**
 * Server-applied narrowing. There is no `page` here on purpose — see
 * `fetchGods`.
 */
export interface GodFilters {
  /** Matches the god's name, or its id when the box holds a number. */
  readonly search?: string
  readonly isActive?: boolean
}

export interface GodPage {
  readonly count: number
  readonly results: readonly God[]
  readonly summary: GodsSummary
}

/** What the *Add god* / *Edit god* form can write. */
export interface GodWrite {
  readonly name: string
  readonly status?: GodStatus
  /** Omit on create and the server puts the god at the end of the list. */
  readonly sortOrder?: number
  /**
   * A new picture to upload, or `null` to clear it. `undefined` leaves it
   * alone — which is the difference between "no change" and "remove".
   */
  readonly media?: File | null
  readonly homeMedia?: File | null
}

export interface GodRepository {
  /**
   * The list, **unpaged**.
   *
   * Paging on this endpoint is opt-in, and this screen declines it: the drag
   * handle reorders against what is on screen, and `reorderGods` demands every
   * god exactly once. Asking for a page here would make a partial order the
   * default and a `400` the reward. Filters still apply server-side, which is
   * why dragging is refused while one is active.
   */
  fetchGods(filters?: GodFilters): Promise<Result<GodPage>>
  createGod(input: GodWrite): Promise<Result<God>>
  updateGod(id: number, input: Partial<GodWrite>): Promise<Result<God>>
  /**
   * Refused with a `400` naming the count when poojas reference the god, or
   * when it has child categories. Deactivate a god in use instead.
   */
  deleteGod(id: number): Promise<Result<void>>
  /**
   * Switched off, not removed. Its poojas stay active and bookable and still
   * name it — the flag only governs whether the god is offered as an entry
   * point in the app.
   */
  setGodStatus(id: number, status: GodStatus): Promise<Result<God>>
  /**
   * Every god id, in the order they should appear. The server numbers them
   * `1..N` in one transaction and hands the reordered list back.
   *
   * One call, not N patches: dragging one row past another moves everything
   * between them, so a per-row write would leave the list half-reordered
   * whenever one failed — and would race any other admin doing the same thing.
   * A partial order is refused rather than applied.
   */
  reorderGods(orderedIds: readonly number[]): Promise<Result<readonly God[]>>
}
