import type { CounterStaff } from '@/features/counter-pos/domain/entities/counter-staff'

/** Staff who can be signed in at the counter (DC prototype default is "Ravi Kumar"). */
export const COUNTER_STAFF: readonly CounterStaff[] = [
  { id: 'staff-1', name: 'Ravi Kumar', role: 'Counter clerk' },
  { id: 'staff-2', name: 'Lakshmi Devi', role: 'Counter clerk' },
  { id: 'staff-3', name: 'Suresh Babu', role: 'Shift supervisor' },
]

/** The prototype's default signed-in counter staff member. */
export const DEFAULT_COUNTER_STAFF: CounterStaff = COUNTER_STAFF[0]
