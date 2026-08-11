/**
 * Every API path in one place — the coding standards forbid magic strings, and
 * a single list is what makes a backend route rename a one-file change.
 *
 * Paths are relative to the axios instance's baseURL, which already carries the
 * server's `/api` mount point (see `core/api/http.ts`).
 */

export const AUTH_ENDPOINTS = {
  csrf: '/auth/csrf/',
  signIn: '/auth/signin/',
  adminSignIn: '/auth/admin-signin/',
  poojariSignIn: '/auth/poojari-signin/',
  logout: '/auth/logout/',
} as const

export const RBAC_ENDPOINTS = {
  myPermissions: '/rbac/me/permissions/',
} as const

export const COUNTER_ENDPOINTS = {
  sales: '/booking/counter/sales/',
  sale: (id: number) => `/booking/counter/sales/${id}/`,
  cancelSale: (id: number) => `/booking/counter/sales/${id}/cancel/`,
  collectionSummary: '/booking/counter/sales/collection-summary/',
  agentBookings: '/booking/counter/agent-bookings/',
  recordAgentPayment: (orderId: number) => `/booking/counter/agent-bookings/${orderId}/record-payment/`,
} as const

export const CATALOGUE_ENDPOINTS = {
  poojas: '/booking/poojas/',
  poojaCategories: '/booking/poojacategory/',
  nakshatrams: '/user/nakshatrams/',
} as const

/**
 * The back-office booking feed and the two actions on it. Mounted under
 * `/admin/`, not `/booking/` — a different Django app from the counter.
 */
export const ADMIN_BOOKING_ENDPOINTS = {
  bookings: '/admin/bookings/all/',
  completeBookings: '/admin/bookings/complete/',
  assignBookings: '/admin/bookings/assign/',
  poojaris: '/admin/poojaris/',
} as const
