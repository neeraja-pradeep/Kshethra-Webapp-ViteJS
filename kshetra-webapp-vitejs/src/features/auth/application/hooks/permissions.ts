/** RBAC codenames the console gates on. Must match the server's `rbac/constants.py`. */
export const PERMISSIONS = {
  accessAdminPortal: 'rbac.access_admin_portal',
  operateCounter: 'rbac.operate_counter',
  collectCounterPayment: 'rbac.collect_counter_payment',
  cancelCounterSale: 'rbac.cancel_counter_sale',
  addPoojaOrder: 'booking.add_poojaorder',
  managePoojaOrders: 'rbac.manage_pooja_orders',
  viewAdminDashboard: 'rbac.view_admin_dashboard',
  manageNotifications: 'rbac.manage_notifications',
  /**
   * Authoring roles — deciding what a role may do. Deliberately separate from
   * `assignRoles`: putting someone on the front desk is a weaker act than
   * inventing new powers, so the two are gated per control, not per screen.
   */
  manageRoles: 'rbac.manage_roles',
  /** Listing roles/users and assigning them. Weaker than `manageRoles`. */
  assignRoles: 'rbac.assign_roles',
  /** Lifts per-object ownership scoping app-wide — the server flags it dangerous. */
  accessAllObjects: 'rbac.access_all_objects',
  /**
   * Required alongside `assignRoles` to read the user registry. The app label
   * is `authentication`, not the `auth` the contract doc shows — verified
   * against the live catalogue, where `auth.view_customuser` does not exist.
   */
  viewCustomuser: 'authentication.view_customuser',
} as const
