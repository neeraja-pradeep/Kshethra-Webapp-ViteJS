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
  /**
   * Staffing the team — creating an account, choosing its base role,
   * deactivating it. Deliberately above `assignRoles`: the split is what stops
   * a role that may hand out existing roles from also minting a new admin.
   */
  manageUsers: 'rbac.manage_users',
  /**
   * Rostering, kept separate from `managePoojaOrders` on purpose: a duty
   * manager can be allowed to move work between poojaris without being given
   * the rest of the back office.
   */
  assignPoojari: 'rbac.assign_poojari',
  /**
   * Cancelling an order or single dates off it. Both move money — one through
   * the gateway, one as a reconciliation entry — so they sit behind their own
   * permission rather than the plain back-office scope.
   */
  refundPoojaOrder: 'rbac.refund_pooja_order',
  /**
   * Acting on a record the signed-in user does not own. The shop's back office
   * endpoints do no ownership check of their own — acting on somebody else's
   * order is the entire job — so this is what keeps devotees out of them.
   */
  accessAllObjects: 'rbac.access_all_objects',
  refundEcommerceOrder: 'rbac.refund_ecommerce_order',

  /**
   * Shop model permissions.
   *
   * `useCan` matches against the flat list the server returns, which carries
   * model codenames alongside the `rbac.*` scopes — so these gate the store
   * screens with no new mechanism. Reading the catalogue is deliberately open
   * to every back office role; writing is not.
   */
  viewProduct: 'e_commerce.view_product',
  addProduct: 'e_commerce.add_product',
  changeProduct: 'e_commerce.change_product',
  deleteProduct: 'e_commerce.delete_product',
  viewProductVariant: 'e_commerce.view_productvariant',
  addProductVariant: 'e_commerce.add_productvariant',
  changeProductVariant: 'e_commerce.change_productvariant',
  viewCategory: 'e_commerce.view_category',
  addCategory: 'e_commerce.add_category',
  changeCategory: 'e_commerce.change_category',
  deleteCategory: 'e_commerce.delete_category',
  /** Adjusting stock is separate from editing the catalogue — App Manager has one, not the other. */
  viewStock: 'e_commerce.view_stock',
  changeStock: 'e_commerce.change_stock',
  viewEcommerceOrder: 'e_commerce.view_order',
  addEcommerceOrder: 'e_commerce.add_order',
  changeEcommerceOrder: 'e_commerce.change_order',
  viewEcommerceOrderLine: 'e_commerce.view_orderline',
  addEcommerceOrderLine: 'e_commerce.add_orderline',
  /**
   * Required alongside `assignRoles` to read the user registry. The app label
   * is `authentication`, not the `auth` the contract doc shows — verified
   * against the live catalogue, where `auth.view_customuser` does not exist.
   */
  viewCustomuser: 'authentication.view_customuser',
  /** Paired with `manageUsers` to create an account. */
  addCustomuser: 'authentication.add_customuser',
  /**
   * Paired with `manageUsers` to edit, deactivate or reactivate an account.
   *
   * Deactivating asks for `change`, not `delete_customuser`: DELETE keeps the
   * row so a clerk who took counter payments stays attributable. The button
   * says delete; the permission is the real one.
   */
  changeCustomuser: 'authentication.change_customuser',
} as const
