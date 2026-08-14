import type { GodFilters } from '@/features/poojas/domain/repositories/god.repository'

/** The sentinel a `<Select>` uses for "no filter" — `''` would collide with a real value. */
export const ALL = 'all'

/** Held as strings because that is what a `<Select>` hands back. */
export interface GodListFilterState {
  readonly search: string
  readonly status: string
}

export function defaultGodListFilters(): GodListFilterState {
  return { search: '', status: ALL }
}

/** Drives the "clear filters" empty state — and whether dragging is allowed. */
export function godListFiltersActive(state: GodListFilterState): boolean {
  return state.search.trim() !== '' || state.status !== ALL
}

/** Filter state → the server's query. Nothing here is applied client-side. */
export function toGodFilters(state: GodListFilterState, search: string): GodFilters {
  return {
    ...(search ? { search } : {}),
    ...(state.status === ALL ? {} : { isActive: state.status === 'active' }),
  }
}
