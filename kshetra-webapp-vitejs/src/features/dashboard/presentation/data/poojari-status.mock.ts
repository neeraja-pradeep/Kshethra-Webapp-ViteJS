import type { PoojariStatusTile } from '@/features/dashboard/domain/entities/poojari-status'

/**
 * Poojari-assignment attention counts. Mirrors the DC prototype's `attn`
 * tally over the bookings seed (grouped by `deriveOcc(b).label`); values
 * are denormalized here so the dashboard stays decoupled from the bookings
 * feature.
 */
export const POOJARI_STATUS_TILES: PoojariStatusTile[] = [
  {
    key: 'awaiting',
    value: 2,
    label: 'Awaiting completion',
    sub: 'Date passed — needs action',
    icon: 'warning-circle',
    iconWeight: 'fill',
    tone: 'warning',
  },
  {
    key: 'reassigned',
    value: 3,
    label: 'Reassigned',
    sub: 'In 24-hour window',
    icon: 'clock-countdown',
    iconWeight: 'regular',
    tone: 'info',
  },
  {
    key: 'overdue',
    value: 1,
    label: 'Overdue',
    sub: 'Reassign again',
    icon: 'warning-octagon',
    iconWeight: 'fill',
    tone: 'danger',
  },
]
