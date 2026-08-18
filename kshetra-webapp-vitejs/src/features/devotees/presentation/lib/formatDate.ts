import { formatOrderDateTime, formatOrderDay } from '@/shared/lib/format'

/** An absent date reads as an em dash rather than as an empty cell. */
const NONE = '—'

/**
 * A day, from either a plain `YYYY-MM-DD` or a full timestamp — "1 Jul 2026".
 *
 * `last_activity`, `joined_at` and `last_login` are datetimes while a booking's
 * `date` and a family member's `dob` are plain dates, and both reach the same
 * columns.
 */
export function formatDisplayDate(iso: string | null | undefined): string {
  return iso ? formatOrderDay(iso) : NONE
}

/** The day and the time — "1 Jul 2026, 9:12 am". Used where the hour matters. */
export function formatDisplayDateTime(iso: string | null | undefined): string {
  return iso ? formatOrderDateTime(iso) : NONE
}
