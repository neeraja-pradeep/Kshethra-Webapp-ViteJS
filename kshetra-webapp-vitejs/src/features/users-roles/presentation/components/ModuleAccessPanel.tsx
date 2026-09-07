import { useMemo, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'
import type { UserModuleAccess } from '@/features/rbac/domain/entities/rbac-user'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'
import { capabilityLabel } from '@/features/users-roles/presentation/utils/capabilityLabels'

export interface ModuleAccessPanelProps {
  /** The server's own module breakdown from `users/{id}/`, in its order. */
  modules: readonly UserModuleAccess[]
  /** The flat codename set, shown behind a disclosure for auditing. */
  permissions: readonly string[]
}

/**
 * What this account can do, module by module — the server's own answer.
 *
 * The endpoint resolves the base role and every assigned role into product
 * modules, so this reads them straight rather than re-deriving them from the
 * codename list. An operator asks "can they void a sale", not "do they hold
 * `rbac.cancel_counter_sale`", and 287 codenames in one wall answers neither.
 *
 * A module nobody holds anything in is still listed, greyed: "no access to
 * Reports" is the answer to a question somebody asked, and hiding it would
 * leave them unable to tell it apart from a module that does not exist.
 *
 * The raw codenames stay one click away — they are what the server actually
 * enforces, and an audit needs to see them.
 */
export function ModuleAccessPanel({ modules, permissions }: ModuleAccessPanelProps) {
  const [showCodenames, setShowCodenames] = useState(false)

  const grantedModuleCount = useMemo(
    () => modules.filter((module) => module.capabilities.some((capability) => capability.granted)).length,
    [modules],
  )

  /** Grouped by app label — the prefix before the dot in `rbac.manage_roles`. */
  const codenameGroups = useMemo(() => {
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
      <ActivityPanelHeader
        icon={<Icon name="shield-check" size={18} />}
        title={`Module access (${grantedModuleCount} of ${modules.length})`}
      />

      <div className="flex flex-col gap-2.5">
        {modules.map((module) => {
          const grantedCount = module.capabilities.filter((capability) => capability.granted).length
          const hasAny = grantedCount > 0
          return (
            <div
              key={module.key}
              className={cn(
                'flex flex-col gap-2 rounded-lg px-3.5 py-3',
                hasAny ? 'bg-sunken' : 'bg-transparent shadow-[inset_0_0_0_0.5px_var(--border-default)]',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  name={hasAny ? 'check-circle' : 'prohibit'}
                  weight={hasAny ? 'fill' : 'regular'}
                  size={15}
                  className={cn('shrink-0', hasAny ? 'text-success' : 'text-ink-subtle')}
                />
                <span className={cn('text-sm font-medium', hasAny ? 'text-ink-strong' : 'text-ink-muted')}>
                  {module.label}
                </span>
                <div className="flex-1" />
                <span className="whitespace-nowrap text-2xs tabular-nums text-ink-subtle">
                  {hasAny ? `${grantedCount} of ${module.capabilities.length}` : 'No access'}
                </span>
              </div>

              {hasAny && (
                <div className="flex flex-wrap gap-1.5">
                  {module.capabilities.map((capability) => (
                    <span
                      key={capability.key}
                      title={capability.key}
                      className={cn(
                        'inline-flex items-center gap-1.25 rounded-md px-2.25 py-1 text-xs',
                        capability.granted
                          ? 'bg-success-surface text-success shadow-[inset_0_0_0_0.5px_var(--color-success-border)]'
                          : 'text-ink-subtle line-through decoration-from-font',
                      )}
                    >
                      {capability.granted && <Icon name="check" size={11} weight="bold" />}
                      {capabilityLabel(capability.key)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 border-t-[0.5px] border-stroke-subtle pt-3">
        <button
          type="button"
          onClick={() => setShowCodenames((shown) => !shown)}
          className="flex items-center gap-1.5 self-start border-none bg-transparent p-0 font-sans text-xs font-medium text-primary"
        >
          <Icon name={showCodenames ? 'caret-down' : 'caret-right'} size={12} />
          {showCodenames ? 'Hide' : 'Show'} the {permissions.length} underlying permissions
        </button>

        {showCodenames &&
          (permissions.length === 0 ? (
            <div className="text-sm text-ink-muted">This account holds no permissions.</div>
          ) : (
            codenameGroups.map(([app, codenames]) => (
              <div key={app} className="flex flex-col gap-1.75">
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{app}</div>
                <div className="flex flex-wrap gap-1.5">
                  {codenames.map((codename) => (
                    <span
                      key={codename}
                      className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2.5 py-1 font-mono text-xs text-ink shadow-xs"
                    >
                      {codename.slice(app.length + 1)}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ))}

        <div className="text-xs leading-snug text-ink-subtle">
          Resolved by the server from the base role plus every assigned role. Change it by changing the roles.
        </div>
      </div>
    </div>
  )
}
