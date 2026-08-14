import { useMemo, useState } from 'react'

import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import type { ModuleSelection } from '@/features/rbac/domain/entities/module-map'
import {
  permissionsToSubmit,
  selectionFromPermissions,
  setModuleCapabilities,
  toggleCapability,
  unmappedPermissions,
} from '@/features/rbac/domain/entities/module-map'

/** What the builder is editing. */
export interface RoleDraft {
  /** Create-only. Permanent once set — `PATCH` ignores it. */
  readonly name: string
  readonly label: string
  readonly description: string
  readonly isActive: boolean
  /** The capabilities ticked, per module. */
  readonly selection: ModuleSelection
  /**
   * Codenames the module view cannot express: whatever the role already held
   * outside the map, plus anything ticked in the advanced view. Carried
   * through every save — dropping them is the feature's worst failure.
   */
  readonly extras: readonly string[]
}

function seed(role: RbacRole | null): RoleDraft {
  if (!role) {
    return { name: '', label: '', description: '', isActive: true, selection: {}, extras: [] }
  }
  return {
    name: role.name,
    label: role.label,
    description: role.description,
    isActive: role.isActive,
    selection: selectionFromPermissions(role.permissions),
    extras: unmappedPermissions(role.permissions),
  }
}

/** Order-insensitive comparison — the submit body is sorted, a role's set may not be. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const other = new Set(b)
  return a.every((value) => other.has(value))
}

export interface RoleDraftState {
  readonly draft: RoleDraft
  /** The exact permission array a save would send. */
  readonly permissions: readonly string[]
  readonly isDirty: boolean
  /** True when unticking the last toggle changed nothing — see `toggleCapability`. */
  readonly lastToggleIneffective: boolean
  setField: <K extends 'name' | 'label' | 'description' | 'isActive'>(key: K, value: RoleDraft[K]) => void
  toggle: (moduleKey: string, capabilityKey: string) => void
  /** Replaces one module's ticks — "select all" and "clear". */
  setModule: (moduleKey: string, capabilityKeys: readonly string[]) => void
  /** Adds or removes a raw codename from `extras` — the advanced view's edit. */
  setExtra: (codename: string, held: boolean) => void
  reset: () => void
}

/**
 * The builder's draft.
 *
 * Seeded once from the fetched role and never reconciled against it: the
 * builder is remounted by `key` when the role changes, which is cheaper to
 * reason about than a derived-state effect and removes the whole class of
 * "the draft went stale after a refetch" bugs.
 *
 * `permissions` is derived on every render rather than stored. That is what
 * makes the untick path safe — there is no running array to subtract from, so
 * the collateral-revoke bug has nowhere to live.
 */
export function useRoleDraft(role: RbacRole | null): RoleDraftState {
  const [draft, setDraft] = useState<RoleDraft>(() => seed(role))
  const [lastToggleIneffective, setLastToggleIneffective] = useState(false)

  const permissions = useMemo(
    () => permissionsToSubmit(draft.selection, draft.extras),
    [draft.selection, draft.extras],
  )

  const isDirty = useMemo(() => {
    if (!role) return draft.name !== '' || draft.label !== '' || permissions.length > 0
    return (
      draft.label !== role.label ||
      draft.description !== role.description ||
      draft.isActive !== role.isActive ||
      !sameSet(permissions, role.permissions)
    )
  }, [draft, permissions, role])

  return {
    draft,
    permissions,
    isDirty,
    lastToggleIneffective,
    setField: (key, value) => setDraft((current) => ({ ...current, [key]: value })),
    toggle: (moduleKey, capabilityKey) =>
      setDraft((current) => {
        const outcome = toggleCapability(current.selection, moduleKey, capabilityKey)
        setLastToggleIneffective(outcome.ineffective)
        return { ...current, selection: outcome.selection }
      }),
    setModule: (moduleKey, capabilityKeys) =>
      setDraft((current) => {
        setLastToggleIneffective(false)
        return { ...current, selection: setModuleCapabilities(current.selection, moduleKey, capabilityKeys) }
      }),
    setExtra: (codename, held) =>
      setDraft((current) => ({
        ...current,
        extras: held
          ? [...new Set([...current.extras, codename])].sort()
          : current.extras.filter((value) => value !== codename),
      })),
    reset: () => {
      setDraft(seed(role))
      setLastToggleIneffective(false)
    },
  }
}
