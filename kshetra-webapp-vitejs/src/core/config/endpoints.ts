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
  permissions: '/rbac/permissions/',
  roles: '/rbac/roles/',
  role: (id: number) => `/rbac/roles/${id}/`,
  roleUsers: (id: number) => `/rbac/roles/${id}/users/`,
  assignRole: (id: number) => `/rbac/roles/${id}/assign/`,
  unassignRole: (id: number) => `/rbac/roles/${id}/unassign/`,
  users: '/rbac/users/',
  user: (id: number) => `/rbac/users/${id}/`,
  /** Hyphenated, unlike the underscored role-assignment actions below. */
  activateUser: (id: number) => `/rbac/users/${id}/activate/`,
  setUserPassword: (id: number) => `/rbac/users/${id}/set-password/`,
  assignableRoles: '/rbac/users/assignable-roles/',
  assignUserRoles: (id: number) => `/rbac/users/${id}/assign_roles/`,
  removeUserRoles: (id: number) => `/rbac/users/${id}/remove_roles/`,
  setUserRoles: (id: number) => `/rbac/users/${id}/set_roles/`,
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

/**
 * The back-office order feed and the order detail page's actions.
 *
 * `allOrders` unions pooja orders and shop orders; the Pooja Orders screen
 * pins `?source=pooja`. Every other path here is pooja-only — the shop has its
 * own detail endpoints.
 */
export const ADMIN_ORDER_ENDPOINTS = {
  allOrders: '/admin/orders/all/',
  poojaOrder: (id: number) => `/admin/orders/pooja/${id}/`,
  poojaOrderReceipt: (id: number) => `/admin/orders/pooja/${id}/receipt/`,
  cancelPoojaOrder: (id: number) => `/admin/orders/pooja/${id}/cancel/`,
  cancelPoojaOrderBookings: (id: number) => `/admin/orders/pooja/${id}/cancel-bookings/`,
  productOrder: (id: number) => `/admin/orders/product/${id}/`,
  productOrderReceipt: (id: number) => `/admin/orders/product/${id}/receipt/`,
  productOrderFulfilment: (id: number) => `/admin/orders/product/${id}/fulfilment/`,
  cancelProductOrder: (id: number) => `/admin/orders/product/${id}/cancel/`,
  refundProductOrder: (id: number) => `/admin/orders/product/${id}/refund/`,
  productWalkIn: '/admin/orders/product/walk-in/',
} as const

/**
 * The shop catalogue.
 *
 * `products` is a **flat** view — one row per product with its primary
 * variant's price, SKU and stock folded in — served under `/admin/` rather than
 * `/ecommerce/` because it is the back office's shape, not the storefront's.
 * Categories are the storefront's own resource, which is why they sit under
 * `/ecommerce/`: the order they are in here is the order a devotee sees.
 */
export const STORE_ENDPOINTS = {
  products: '/admin/store/products/',
  newProduct: '/admin/store/products/new/',
  product: (id: number) => `/admin/store/products/${id}/`,
  productStatus: (id: number) => `/admin/store/products/${id}/status/`,
  /** `POST` adjusts stock, `GET` returns the adjustment history. */
  productStock: (id: number) => `/admin/store/products/${id}/stock/`,
  categories: '/ecommerce/category/',
  category: (id: number) => `/ecommerce/category/${id}/`,
  reorderCategories: '/ecommerce/category/reorder/',
  /** How a multi-variant product is managed — the flat view never writes variants. */
  productVariants: '/ecommerce/product-variant/',
} as const
