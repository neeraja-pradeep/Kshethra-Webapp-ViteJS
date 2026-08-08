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
  manageRoles: 'rbac.manage_roles',
} as const
