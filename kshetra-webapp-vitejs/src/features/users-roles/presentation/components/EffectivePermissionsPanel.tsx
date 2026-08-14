import { useMemo } from 'react'

import { Icon } from '@/shared/ui'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'

export interface EffectivePermissionsPanelProps {
  /** Codenames from `users/{id}/` — the base role's set unioned with every assigned role's. */
  permissions: readonly string[]
}

/**
 * What this user can actually do, resolved by the server.
 *
 * Replaces the design's "Module access" panel, which listed hardcoded module
 * names per role. Those names were invented by the prototype and had no
 * relationship to what the server enforces.
 */
export function EffectivePermissionsPanel({ permissions }: EffectivePermissionsPanelProps) {
  /** Grouped by app label — the prefix before the dot in `rbac.manage_roles`. */
  const groups = useMemo(() => {
    const byApp = new Map<string, string[]>()
    for (const permission of [...permissions].sort()) {
      const [app = 'other'] = permission.split('.')
      const bucket = byApp.get(app) ?? []
      bucket.push(permission)
      byApp.set(app, bucket)
    }
    return Array.from(byApp.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [permissions])

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader icon={<Icon name="shield-check" size={18} />} title={`Effective permissions (${permissions.length})`} />

      {permissions.length === 0 ? (
        <div className="text-sm text-ink-muted">This account holds no permissions.</div>
      ) : (
        groups.map(([app, codenames]) => (
          <div key={app} className="flex flex-col gap-1.75">
            <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{app}</div>
            <div className="flex flex-wrap gap-1.5">
              {codenames.map((codename) => (
                <span key={codename} className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2.5 py-1 font-mono text-xs text-ink shadow-xs">
                  {codename.slice(app.length + 1)}
                </span>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="text-xs leading-snug text-ink-subtle">
        Resolved by the server from the base role plus every assigned role. Change it by changing the roles.
      </div>
    </div>
  )
}
