/**
 * Per-role module allowlists.
 *
 * Gating is normally permission-driven — see `nav.ts`, which is the rule, not
 * the exception. This file is the narrow override for roles the server grants
 * *more* than they should see: `counter_staff` holds read on the pooja
 * catalogue because the counter screen needs it to price a booking, so the
 * permission cannot be taken away without breaking the till. Hiding the module
 * is therefore a front-of-house decision, and it can only be expressed here.
 *
 * A role absent from this map is unrestricted and falls through to the
 * permission gate alone — which is why admin, manager and every custom role an
 * admin invents this afternoon keep working with no entry here.
 */

/** NAV ids each restricted base role may reach. Keys are `base_role` values. */
const ROLE_MODULES: Readonly<Record<string, readonly string[]>> = {
  counter_staff: ['counter', 'pooja-bookings', 'pooja-orders'],
  reports_manager: ['reports'],
  app_manager: ['app'],
  store_manager: ['store'],
}

/**
 * NAV ids every role keeps, restricted or not.
 *
 * Tech support is deliberately ungated in NAV so anyone who can reach the
 * console can report that it is broken; an allowlist that dropped it would
 * silence exactly the roles most likely to hit a bug.
 */
const ALWAYS_ALLOWED: readonly string[] = ['tech-support']

/**
 * The NAV ids this base role may reach, or `null` when it is unrestricted.
 *
 * `null` and "an empty list" are different answers and must not collapse into
 * one: unrestricted means "defer to permissions", which is every role that is
 * not named above.
 */
export function allowedModuleIds(baseRole: string | undefined): readonly string[] | null {
  if (!baseRole) return null
  const modules = ROLE_MODULES[baseRole]
  if (!modules) return null
  return [...modules, ...ALWAYS_ALLOWED]
}

/** True when this base role is one the map restricts. */
export function isRestrictedRole(baseRole: string | undefined): boolean {
  return allowedModuleIds(baseRole) !== null
}
