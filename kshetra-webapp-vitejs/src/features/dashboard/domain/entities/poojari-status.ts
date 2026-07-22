/** Which attention bucket a poojari-assigned booking currently sits in. */
export type PoojariStatusKey = 'awaiting' | 'reassigned' | 'overdue'

/** Design-token colour tone driving a poojari status tile's icon + ring. */
export type PoojariStatusTone = 'warning' | 'info' | 'danger'

/**
 * A poojari-management attention tile — a count of bookings needing action,
 * grouped by why they need it (awaiting completion, mid-reassignment, or
 * past the 24-hour reassignment window).
 */
export interface PoojariStatusTile {
  readonly key: PoojariStatusKey
  readonly value: number
  readonly label: string
  readonly sub: string
  readonly icon: string
  /** 'fill' for the two urgent states, 'regular' for the in-progress one. */
  readonly iconWeight: 'regular' | 'fill'
  readonly tone: PoojariStatusTone
}
