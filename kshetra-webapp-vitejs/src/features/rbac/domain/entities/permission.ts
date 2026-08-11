/**
 * The server's permission catalogue — the raw material of the role builder.
 *
 * This cannot be a client constant. `PERMISSIONS` in the auth feature lists the
 * handful of codenames the console itself branches on; the builder has to offer
 * every permission the server knows about, which only the server can enumerate.
 */

/** A single grantable permission. */
export interface Permission {
  /** The identifier sent back in a role's `permissions` — `id` is incidental. */
  readonly value: string
  readonly id: number
  /** Human sentence, e.g. "Can sign in to the admin back office". */
  readonly name: string
  /** The bare codename — `value` without its app label. Searchable. */
  readonly codename: string
  readonly appLabel: string
  /** The model it acts on, e.g. `accesscontrol`. Searchable. */
  readonly model: string
  /** Warrants a confirmation step before granting. */
  readonly isDangerous: boolean
  /** Why it is dangerous. Present whenever `isDangerous`; show it verbatim. */
  readonly warning: string | null
}

/** One rendered section of the catalogue. */
export interface PermissionGroup {
  readonly appLabel: string
  readonly label: string
  readonly permissions: readonly Permission[]
}

export interface PermissionCatalogue {
  readonly count: number
  /** The values flagged dangerous, for a summary without walking every group. */
  readonly dangerousValues: readonly string[]
  readonly groups: readonly PermissionGroup[]
}

/**
 * The group that separates the back office from the devotee app. It decides
 * whether a role can sign in at all, so it leads the catalogue.
 */
export const SPECIAL_ACTIONS_LABEL = 'Special actions'

/** Groups in render order: "Special actions" first, the rest as the server sent them. */
export function orderedGroups(catalogue: PermissionCatalogue): readonly PermissionGroup[] {
  const special = catalogue.groups.filter((group) => group.label === SPECIAL_ACTIONS_LABEL)
  const rest = catalogue.groups.filter((group) => group.label !== SPECIAL_ACTIONS_LABEL)
  return [...special, ...rest]
}

/** Every permission across every group, flattened. */
export function allPermissions(catalogue: PermissionCatalogue): readonly Permission[] {
  return catalogue.groups.flatMap((group) => group.permissions)
}

/** Looks a permission up by its `value`, for rendering a role's existing set. */
export function findPermission(catalogue: PermissionCatalogue, value: string): Permission | null {
  return allPermissions(catalogue).find((permission) => permission.value === value) ?? null
}
