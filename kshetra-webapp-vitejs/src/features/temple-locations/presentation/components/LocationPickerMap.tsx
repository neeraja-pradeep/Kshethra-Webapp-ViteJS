import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * The pin-and-radius picker.
 *
 * **The text inputs stay authoritative.** This map writes to them and reads
 * from them; it never holds coordinates of its own. That keeps the 6-decimal
 * string contract intact — the value the server compares distances against is
 * the one the operator can see and type, not something a map projection
 * round-tripped through a float.
 *
 * Leaflet is driven directly rather than through `react-leaflet`, which is
 * Hippocratic-2.1 licensed; Leaflet itself is BSD-2-Clause, like everything
 * else this app depends on.
 */

/** Kerala, roughly — only ever shown when there is nothing to centre on. */
const FALLBACK_CENTER: L.LatLngTuple = [10.5276, 76.2144]
const FALLBACK_ZOOM = 8
/** Close enough to see a compound once we have a real pin. */
const PIN_ZOOM = 17

/** Six places, matching the server's column. */
function toFixed6(value: number): string {
  return value.toFixed(6)
}

/**
 * The brand colour, resolved to a literal.
 *
 * Leaflet writes `color` straight into an SVG `stroke` presentation attribute
 * (`setAttribute('stroke', options.color)`), where `var(--color-primary)` does
 * not resolve — so the token is read from the document instead of hardcoding a
 * second copy of the hex here.
 */
function primaryColor(): string {
  if (typeof window === 'undefined') return '#8C001A'
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim()
  return resolved || '#8C001A'
}

export interface LocationPickerMapProps {
  /** The form's current strings. Empty while the operator has typed nothing. */
  latitude: string
  longitude: string
  radiusMeters: number
  disabled?: boolean
  onPick: (latitude: string, longitude: string) => void
}

export function LocationPickerMap({
  latitude,
  longitude,
  radiusMeters,
  disabled = false,
  onPick,
}: LocationPickerMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  /** Read inside Leaflet's own callbacks, which are bound once. */
  const onPickRef = useRef(onPick)
  const disabledRef = useRef(disabled)

  useEffect(() => { onPickRef.current = onPick }, [onPick])
  useEffect(() => { disabledRef.current = disabled }, [disabled])

  /** Create once. Leaflet owns this DOM node; React must not re-render into it. */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return

    const map = L.map(hostRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      // A modal is a small canvas; the zoom buttons are enough and a stray
      // scroll over the map should scroll the form, not zoom the world.
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // Required by the OSM tile usage policy.
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (disabledRef.current) return
      onPickRef.current(toFixed6(event.latlng.lat), toFixed6(event.latlng.lng))
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [])

  /**
   * Follow the inputs.
   *
   * Runs on every keystroke in the coordinate fields as well as on a map click,
   * so typing and clicking stay the same operation as far as the map is
   * concerned.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const lat = Number(latitude)
    const lng = Number(longitude)
    const hasPin =
      latitude.trim() !== '' &&
      longitude.trim() !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180

    if (!hasPin) {
      markerRef.current?.remove()
      circleRef.current?.remove()
      markerRef.current = null
      circleRef.current = null
      return
    }

    const position: L.LatLngTuple = [lat, lng]

    if (!markerRef.current) {
      markerRef.current = L.marker(position, { draggable: !disabled }).addTo(map)
      markerRef.current.on('dragend', () => {
        const moved = markerRef.current?.getLatLng()
        if (moved) onPickRef.current(toFixed6(moved.lat), toFixed6(moved.lng))
      })
      // Only jump the viewport when the pin first appears; panning away from a
      // pin the operator is nudging would fight them.
      map.setView(position, PIN_ZOOM)
    } else {
      markerRef.current.setLatLng(position)
    }

    // Radius in metres is Leaflet's native unit, so this is the geofence the
    // server will actually enforce — not an approximation of it.
    if (!circleRef.current) {
      const accent = primaryColor()
      circleRef.current = L.circle(position, {
        radius: radiusMeters,
        color: accent,
        fillColor: accent,
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map)
    } else {
      circleRef.current.setLatLng(position)
      circleRef.current.setRadius(radiusMeters)
    }
  }, [latitude, longitude, radiusMeters, disabled])

  /** A dragged pin while saving would post a coordinate nobody confirmed. */
  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    if (disabled) marker.dragging?.disable()
    else marker.dragging?.enable()
  }, [disabled])

  /**
   * A map created inside a modal measures itself before the dialog has its
   * final size, and renders as a grey strip until something invalidates it.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !hostRef.current) return
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(hostRef.current)
    return () => observer.disconnect()
  }, [])

  return <div ref={hostRef} className="h-full w-full" />
}

export default LocationPickerMap
