import type { Permission, PermissionCatalogue } from '@/features/rbac/domain/entities/permission'
import { allPermissions } from '@/features/rbac/domain/entities/permission'

/**
 * Per-codename metadata, read from the server's catalogue.
 *
 * The module map deliberately holds none of this. It owns gating *structure* —
 * which codenames an action needs, which the server does not expose yet. The
 * catalogue owns the *metadata*: display name, whether a permission is
 * dangerous, and the warning text to show when granting it. That half the
 * server does expose, so it is authoritative and must not be copied.
 *
 * The contract doc and the backend's `DANGEROUS_PERMISSIONS` both list four
 * dangerous permissions; the live catalogue returned three. A hardcoded list
 * would be wrong in one direction or the other on any given deployment — this
 * one cannot be.
 */
export type PermissionIndex = ReadonlyMap<string, Permission>

/** Indexes the catalogue by codename. Build once per catalogue, not per render. */
export function buildPermissionIndex(catalogue: PermissionCatalogue | undefined): PermissionIndex {
  if (!catalogue) return new Map()
  return new Map(allPermissions(catalogue).map((permission) => [permission.value, permission]))
}

/** The dangerous permissions among these codenames. Empty means safe to grant silently. */
export function dangerousIn(codenames: readonly string[], index: PermissionIndex): readonly Permission[] {
  return codenames
    .map((codename) => index.get(codename))
    .filter((permission): permission is Permission => permission?.isDangerous === true)
}

/** The server's sentence for a codename, falling back to the codename itself. */
export function permissionName(codename: string, index: PermissionIndex): string {
  return index.get(codename)?.name ?? codename
}

/**
 * Codenames the map names but the server's catalogue does not know.
 *
 * A typo here — the `auth.` vs `authentication.` class of bug the RBAC layer
 * already hit once — is rejected by the server as a `400` that fails the whole
 * request. Surfacing it in the builder during development turns a save-time
 * failure into something visible on first render.
 */
export function unknownCodenames(codenames: Iterable<string>, index: PermissionIndex): readonly string[] {
  if (index.size === 0) return []
  return [...codenames].filter((codename) => !index.has(codename)).sort()
}
