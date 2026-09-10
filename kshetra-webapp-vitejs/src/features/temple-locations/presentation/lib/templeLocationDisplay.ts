import type { BadgeColor } from '@/shared/ui'

import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  RADIUS_MAX_METERS,
  RADIUS_MIN_METERS,
} from '@/features/temple-locations/domain/entities/temple-location'

/** The pill on a row. Inactive is grey, not red — it is a state, not a fault. */
export function statusBadge(isActive: boolean): { label: string; color: BadgeColor } {
  return isActive ? { label: 'Active', color: 'green' } : { label: 'Inactive', color: 'gray' }
}

/** `500 m`, or `1.2 km` once metres stop being readable. */
export function formatRadius(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km`
  return `${meters} m`
}

/** `10.123456, 76.654321` — the two decimals as stored, never reformatted. */
export function formatCoordinates(latitude: string, longitude: string): string {
  return `${latitude}, ${longitude}`
}

/** A maps link, so somebody can check the pin is where they think it is. */
export function mapsUrl(latitude: string, longitude: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
}

export interface TempleLocationFormValues {
  name: string
  latitude: string
  longitude: string
  radiusMeters: string
  isActive: boolean
}

export type TempleLocationFormErrors = Partial<Record<keyof TempleLocationFormValues, string>>

export function blankTempleLocationForm(): TempleLocationFormValues {
  return { name: '', latitude: '', longitude: '', radiusMeters: '200', isActive: true }
}

/**
 * Client-side validation, mirroring the server's bounds.
 *
 * The server is still the authority and its field errors win on submit — this
 * exists so a typo is caught beside the field instead of after a round trip.
 */
export function validateTempleLocationForm(
  values: TempleLocationFormValues,
): TempleLocationFormErrors {
  const errors: TempleLocationFormErrors = {}

  if (!values.name.trim()) errors.name = 'A name is required.'
  else if (values.name.trim().length > 120) errors.name = 'Keep the name to 120 characters or fewer.'

  const coordinate = (
    raw: string,
    min: number,
    max: number,
    label: string,
  ): string | undefined => {
    if (!raw.trim()) return `${label} is required.`
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return `${label} must be a number.`
    if (parsed < min || parsed > max) return `${label} must be between ${min} and ${max}.`
    return undefined
  }

  const latitude = coordinate(values.latitude, LATITUDE_MIN, LATITUDE_MAX, 'Latitude')
  if (latitude) errors.latitude = latitude
  const longitude = coordinate(values.longitude, LONGITUDE_MIN, LONGITUDE_MAX, 'Longitude')
  if (longitude) errors.longitude = longitude

  const radius = Number(values.radiusMeters)
  if (!values.radiusMeters.trim()) errors.radiusMeters = 'A radius is required.'
  else if (!Number.isInteger(radius)) errors.radiusMeters = 'The radius must be a whole number of metres.'
  else if (radius < RADIUS_MIN_METERS || radius > RADIUS_MAX_METERS) {
    errors.radiusMeters = `The radius must be between ${RADIUS_MIN_METERS} and ${RADIUS_MAX_METERS} metres.`
  }

  return errors
}
