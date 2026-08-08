import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import type { UserRole } from '@/shared/types/common'

/** A single leaf navigation destination. */
export interface NavLeaf {
  id: string
  label: string
  icon: string
  path: string
  desc: string
  /** Display vocabulary only — never gate on this. */
  roles: UserRole[]
  /**
   * RBAC codenames the signed-in user must ALL hold for this entry to render.
   * Empty means "any signed-in console user".
   */
  permissions?: readonly string[]
}

/** A top-level nav entry: either a leaf (has `path`) or an expandable group. */
export interface NavItem {
  id: string
  label: string
  icon: string
  desc: string
  roles: UserRole[]
  permissions?: readonly string[]
  /** Set for a direct destination. */
  path?: string
  /** Set for an expandable group. */
  children?: NavLeaf[]
  /** Divider group index — a rule is drawn between changing groups. */
  group: number
}

/**
 * Sidebar navigation model — mirrors the design's NAV.
 *
 * `roles` is display vocabulary left over from the design. Gating reads
 * `permissions` (RBAC codenames from the server) — a counter operator's base
 * role is still `temple_user`, so role names would hide the console from
 * exactly the people who were granted it.
 */
export const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'squares-four', path: '/dashboard', desc: 'Operational snapshot.', roles: ['Admin', 'Manager'], permissions: [PERMISSIONS.viewAdminDashboard], group: 0 },

  { id: 'counter', label: 'Counter Bookings', icon: 'receipt', path: '/counter', desc: 'Walk-in counter sales and receipts.', roles: ['Admin', 'Manager', 'Counter staff'], permissions: [PERMISSIONS.operateCounter], group: 1 },
  { id: 'pooja-bookings', label: 'Pooja Bookings', icon: 'calendar-check', path: '/pooja-bookings', desc: 'Execution view — poojas to perform, by date.', roles: ['Admin', 'Manager'], group: 1 },
  { id: 'pooja-orders', label: 'Pooja Orders', icon: 'currency-inr', path: '/pooja-orders', desc: 'Transaction view — orders, payments, refunds.', roles: ['Admin', 'Manager'], permissions: [PERMISSIONS.managePoojaOrders], group: 1 },
  {
    id: 'store', label: 'Store', icon: 'shopping-bag', desc: 'Orders, products, categories, and inventory.', roles: ['Admin', 'Manager', 'Store staff'], group: 1,
    children: [
      { id: 'store-orders', label: 'Orders', icon: 'shopping-cart-simple', path: '/store/orders', desc: 'Store orders — fulfilment and refunds.', roles: ['Admin', 'Manager', 'Store staff'] },
      { id: 'store-products', label: 'Products', icon: 'package', path: '/store/products', desc: 'Products, pricing, and stock.', roles: ['Admin', 'Manager', 'Store staff'] },
      { id: 'store-categories', label: 'Categories', icon: 'tag', path: '/store/categories', desc: 'Product categories and their order.', roles: ['Admin', 'Manager', 'Store staff'] },
    ],
  },

  {
    id: 'pooja-mgmt', label: 'Pooja Management', icon: 'flame', desc: 'Master data for poojas and gods.', roles: ['Admin', 'Manager'], group: 2,
    children: [
      { id: 'poojas', label: 'Poojas', icon: 'flame', path: '/poojas', desc: 'All poojas and their pricing.', roles: ['Admin', 'Manager'] },
      { id: 'gods', label: 'Gods', icon: 'hands-praying', path: '/gods', desc: 'Gods referenced by poojas.', roles: ['Admin', 'Manager'] },
    ],
  },

  {
    id: 'app', label: 'App', icon: 'device-mobile', desc: 'The devotee app — accounts, messaging, media.', roles: ['Admin', 'Manager'], group: 3,
    children: [
      { id: 'devotees', label: 'Devotees', icon: 'users-three', path: '/devotees', desc: 'App user accounts and booking history.', roles: ['Admin', 'Manager'] },
      { id: 'notifications', label: 'Notifications', icon: 'megaphone', path: '/notifications', desc: 'Broadcast messages to app users.', roles: ['Admin', 'Manager'], permissions: [PERMISSIONS.manageNotifications] },
      { id: 'media', label: 'Media', icon: 'music-notes', path: '/media', desc: 'Audio tracks and cover art for the app.', roles: ['Admin', 'Manager'] },
    ],
  },

  { id: 'agent-code', label: 'Agent code', icon: 'identification-badge', path: '/agent-codes', desc: 'Booking-agent codes and attribution.', roles: ['Admin', 'Manager'], group: 4 },
  { id: 'reports', label: 'Reports', icon: 'chart-bar', path: '/reports', desc: 'Financial reconciliation and reports.', roles: ['Admin', 'Manager'], group: 4 },
  { id: 'users-roles', label: 'Users & Roles', icon: 'users-three', path: '/users-roles', desc: 'Employee and login registry.', roles: ['Admin'], permissions: [PERMISSIONS.manageRoles], group: 4 },
]
