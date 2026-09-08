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

/**
 * The back office landing screen. One request carries every card — pooja
 * bookings, counter takings, store fulfilment, poojari attention and devotees
 * — counted server-side the same way the screens behind them count.
 */
export const DASHBOARD_ENDPOINTS = {
  data: '/admin/dashboard/data/',
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
  recordAgentPayment: (orderId: number) =>
    `/booking/counter/agent-bookings/${orderId}/record-payment/`,
} as const

export const CATALOGUE_ENDPOINTS = {
  poojas: '/booking/poojas/',
  poojaCategories: '/booking/poojacategory/',
  nakshatrams: '/user/nakshatrams/',
} as const

/**
 * Pooja Management — the back office's write side of the same two resources
 * the counter reads through `CATALOGUE_ENDPOINTS`.
 *
 * A god is a `PoojaCategory`: the screen says God, the table predates the
 * screen, and every pooja, order and report already points at it.
 */
export const POOJA_ADMIN_ENDPOINTS = {
  gods: '/booking/poojacategory/',
  god: (id: number) => `/booking/poojacategory/${id}/`,
  reorderGods: '/booking/poojacategory/reorder/',
  bulkStatusGods: '/booking/poojacategory/bulk-status/',
  bulkDeleteGods: '/booking/poojacategory/bulk-delete/',

  poojas: '/booking/poojas/',
  pooja: (id: number) => `/booking/poojas/${id}/`,
  duplicatePooja: (id: number) => `/booking/poojas/${id}/duplicate/`,
  bulkStatusPoojas: '/booking/poojas/bulk-status/',
  bulkDeletePoojas: '/booking/poojas/bulk-delete/',

  /** `GET` lists this pooja's blocks, `POST` adds one. Both need `change_pooja`. */
  poojaBlocks: (id: number) => `/booking/poojas/${id}/unavailable-dates/`,
  poojaBlock: (id: number, blockId: number) =>
    `/booking/poojas/${id}/unavailable-dates/${blockId}/`,
  /** The read-only view of the same calendar — `view_pooja`, not `change_pooja`. */
  poojaAvailability: (id: number) => `/booking/poojas/${id}/availability/`,

  importPoojas: '/booking/poojas/import/',
  importTemplate: '/booking/poojas/import/template/',

  specialPoojaDates: '/booking/special-pooja-dates/',
  specialPoojaDate: (id: number) => `/booking/special-pooja-dates/${id}/`,
  specialPoojaDateRepeats: '/booking/special-pooja-date-repeats/',
  specialPoojaDateRepeat: (id: number) => `/booking/special-pooja-date-repeats/${id}/`,
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
  /**
   * The gods (pooja categories) whose shrine one poojari keeps.
   *
   * `GET` needs `manage_poojaris`, `PUT` needs `manage_poojari_gods` — choosing
   * someone else's workload is a different act from reading it. The `PUT`
   * replaces the whole list; there is no per-row write. Pointing either at an
   * account that is not a poojari is a 404, not a 403.
   */
  poojariGods: (id: number) => `/admin/poojaris/${id}/gods/`,
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
 * Agent codes — the codes a devotee applies in the app so a booking becomes
 * payable at the temple counter instead of online.
 *
 * `newCode` is a dedicated create path rather than a POST to the list, and
 * `codeStatus` exists so the list's toggle cannot post a stale copy of every
 * other field back with it.
 */
export const AGENT_CODE_ENDPOINTS = {
  codes: '/admin/agent-codes/',
  newCode: '/admin/agent-codes/new/',
  code: (id: number) => `/admin/agent-codes/${id}/`,
  codeStatus: (id: number) => `/admin/agent-codes/${id}/status/`,
} as const

/**
 * App > Devotees — the app's sign-ups.
 *
 * A separate resource from `RBAC_ENDPOINTS.users`, which is staff and poojaris:
 * the two screens answer different questions and share nothing but the table
 * they read from. There is no create — nothing but signing up in the app makes
 * a devotee account — and no delete; `devoteeStatus` is the only write.
 */
export const DEVOTEE_ENDPOINTS = {
  devotees: '/admin/devotees/',
  devotee: (id: number) => `/admin/devotees/${id}/`,
  devoteeStatus: (id: number) => `/admin/devotees/${id}/status/`,
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
