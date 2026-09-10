/**
 * Domain types for the attendance geofence. Plain data — no logic, no React.
 *
 * A `TempleLocation` is a circle on the map: a poojari marking "present" must be
 * inside it, and the server measures the distance itself. The radius is the
 * geofence's only dial, which is why these numbers live in a table rather than
 * in the mobile build — widening one is how the office answers "the GPS will
 * not let me mark" without waiting for a release.
 */

/** Metres. Below this the sanctum itself would be refused. */
export const RADIUS_MIN_METERS = 10
/** Metres. Above this is a district, not a premises. */
export const RADIUS_MAX_METERS = 5000
/** What the server applies when `radius_meters` is omitted. */
export const RADIUS_DEFAULT_METERS = 200

export const LATITUDE_MIN = -90
export const LATITUDE_MAX = 90
export const LONGITUDE_MIN = -180
export const LONGITUDE_MAX = 180

export interface TempleLocation {
  readonly id: number
  readonly name: string
  /**
   * Kept as **strings**, exactly as the wire carries them.
   *
   * They are decimals with 6 places; parsing to a float to display and
   * re-serialising would drift the last place, and this value decides whether
   * somebody's attendance is accepted. Nothing here does arithmetic on them.
   */
  readonly latitude: string
  readonly longitude: string
  readonly radiusMeters: number
  /**
   * An inactive site is kept, not deleted — its poojari assignments and its
   * attendance history survive. See `deletable` guidance in the API doc.
   */
  readonly isActive: boolean
}

/** A page of the list. The endpoint is the only paginated one in this feature. */
export interface TempleLocationPage {
  readonly count: number
  readonly results: readonly TempleLocation[]
}

/**
 * What the create and edit forms write.
 *
 * All-optional because the edit form `PATCH`es: a key that is absent is left
 * alone server-side. Nothing here is nullable — none of these fields can be
 * cleared, only changed.
 */
export interface TempleLocationWrite {
  readonly name?: string
  readonly latitude?: string
  readonly longitude?: string
  readonly radiusMeters?: number
  readonly isActive?: boolean
}

/**
 * Which site a poojari is measured against, given the sites that exist.
 *
 * Rule 2 is the whole reason this matters to the screen: a single active site
 * needs no assignment, but **the moment a second goes active, every unassigned
 * poojari stops being able to mark** — and there is no REST endpoint to assign
 * one yet. The screen has to say so before somebody activates a second site.
 */
export type GeofenceReadiness =
  | { readonly kind: 'ready'; readonly site: TempleLocation }
  | { readonly kind: 'none' }
  | { readonly kind: 'ambiguous'; readonly count: number }

export function readGeofenceReadiness(locations: readonly TempleLocation[]): GeofenceReadiness {
  const active = locations.filter((location) => location.isActive)
  if (active.length === 0) return { kind: 'none' }
  if (active.length === 1) return { kind: 'ready', site: active[0] }
  return { kind: 'ambiguous', count: active.length }
}
