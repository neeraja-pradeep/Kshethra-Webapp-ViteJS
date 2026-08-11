/** Counter-specific wire helpers, plus the shared ones re-exported from core. */

// `decimal` and `paginated` moved to core once the bookings feed needed them
// too — re-exported here so the counter DTOs keep one wire import.
export { countedList, decimal, paginated } from '@/core/api/wire'
