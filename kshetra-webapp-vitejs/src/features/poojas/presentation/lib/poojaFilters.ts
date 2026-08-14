import type {
  PoojaFilters,
  PoojaOrdering,
  PoojaOrderingField,
} from '@/features/poojas/domain/repositories/pooja.repository'

/** The sentinel a `<Select>` uses for "no filter" — `''` would collide with a real value. */
export const ALL = 'all'

export type SortDir = 'asc' | 'desc'

/**
 * The sortable headers. A closed union because `?ordering=` accepts only these
 * and answers an unknown field with a `400` — which is the one failure a
 * sortable table cannot show the user, so it must not be reachable.
 */
export type PoojaSortKey = Extract<
  PoojaOrderingField,
  'name' | 'offline_price' | 'online_price' | 'poojari_incentive' | 'status'
>

/** Held as strings because that is what a `<Select>` hands back. */
export interface PoojaListFilterState {
  readonly search: string
  readonly god: string
  readonly status: string
  readonly special: string
  readonly incentive: string
  readonly sortKey: PoojaSortKey | ''
  readonly sortDir: SortDir
}

export function defaultPoojaListFilters(): PoojaListFilterState {
  return {
    search: '',
    god: ALL,
    status: ALL,
    special: ALL,
    incentive: ALL,
    sortKey: '',
    sortDir: 'asc',
  }
}

export function poojaListFiltersActive(state: PoojaListFilterState): boolean {
  return (
    state.search.trim() !== '' ||
    state.god !== ALL ||
    state.status !== ALL ||
    state.special !== ALL ||
    state.incentive !== ALL
  )
}

function toOrdering(key: PoojaSortKey | '', dir: SortDir): PoojaOrdering | undefined {
  if (!key) return undefined
  return dir === 'desc' ? (`-${key}` as PoojaOrdering) : key
}

/** Filter state → the server's query. Nothing here is applied client-side. */
export function toPoojaFilters(
  state: PoojaListFilterState,
  page: number,
  pageSize: number,
  search: string,
): PoojaFilters {
  const ordering = toOrdering(state.sortKey, state.sortDir)
  return {
    ...(search ? { search } : {}),
    ...(state.god === ALL ? {} : { god: Number(state.god) }),
    ...(state.status === ALL ? {} : { status: state.status === 'active' }),
    ...(state.special === ALL ? {} : { special: state.special === 'special' }),
    ...(state.incentive === ALL ? {} : { hasIncentive: state.incentive === 'with' }),
    ...(ordering ? { ordering } : {}),
    page,
    pageSize,
  }
}
