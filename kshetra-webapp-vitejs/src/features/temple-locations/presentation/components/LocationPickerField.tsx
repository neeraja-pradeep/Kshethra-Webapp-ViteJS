import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react'

import { Icon, Spinner } from '@/shared/ui'

import { mapsUrl } from '@/features/temple-locations/presentation/lib/templeLocationDisplay'

/**
 * Leaflet and its stylesheet are ~42 KB gzipped and this is the only screen
 * that maps anything, so the whole thing is split out of the main bundle and
 * fetched when the modal opens.
 */
const LocationPickerMap = lazy(() =>
  import('@/features/temple-locations/presentation/components/LocationPickerMap').then((module) => ({
    default: module.LocationPickerMap,
  })),
)

/**
 * Back-office software runs on temple wifi, and OSM tiles are a third-party
 * origin that a restrictive network may simply not reach. A map that fails
 * must not take the form down with it — the coordinate inputs above are still
 * a complete way to do the job.
 */
class MapBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[temple-location] map failed to load; falling back to coordinates only', error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export interface LocationPickerFieldProps {
  latitude: string
  longitude: string
  radiusMeters: number
  disabled?: boolean
  onPick: (latitude: string, longitude: string) => void
}

/** Frame, hint and failure handling around the map itself. */
export function LocationPickerField({
  latitude,
  longitude,
  radiusMeters,
  disabled = false,
  onPick,
}: LocationPickerFieldProps) {
  const hasPin = latitude.trim() !== '' && longitude.trim() !== ''

  const unavailable = (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
      <Icon name="map-trifold" size={22} className="text-ink-subtle" />
      <span className="text-xs text-ink-subtle">
        The map could not be loaded. The coordinates above are all that is required.
      </span>
      {hasPin && (
        <a
          href={mapsUrl(latitude, longitude)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          Check the pin in Google Maps
          <Icon name="arrow-square-out" size={12} />
        </a>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-52 overflow-hidden rounded-xl bg-sunken shadow-[inset_0_0_0_1px_var(--color-stroke-subtle)]">
        <MapBoundary fallback={unavailable}>
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Spinner size={22} />
              </div>
            }
          >
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              radiusMeters={radiusMeters}
              disabled={disabled}
              onPick={onPick}
            />
          </Suspense>
        </MapBoundary>
      </div>
      <span className="text-2xs text-ink-subtle">
        {hasPin
          ? 'Click or drag the pin to move it. The shaded circle is the area attendance is accepted from.'
          : 'Click the map to drop a pin, or type the coordinates above.'}
      </span>
    </div>
  )
}
