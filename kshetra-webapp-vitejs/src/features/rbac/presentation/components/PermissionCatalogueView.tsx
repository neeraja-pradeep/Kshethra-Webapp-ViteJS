import { useMemo, useState } from 'react'

import { Badge, Checkbox, Icon, Input } from '@/shared/ui'
import type { Permission, PermissionCatalogue } from '@/features/rbac/domain/entities/permission'
import { orderedGroups } from '@/features/rbac/domain/entities/permission'
import { expandCapabilities, type ModuleSelection } from '@/features/rbac/domain/entities/module-map'

export interface PermissionCatalogueViewProps {
  catalogue: PermissionCatalogue
  /** The capabilities currently ticked — decides which rows are locked. */
  selection: ModuleSelection
  /** Codenames held outside the module view; the only ones editable here. */
  extras: readonly string[]
  disabled: boolean
  onToggleExtra: (codename: string, held: boolean) => void
}

function matches(permission: Permission, needle: string): boolean {
  if (!needle) return true
  const term = needle.toLowerCase()
  return (
    permission.name.toLowerCase().includes(term) ||
    permission.codename.toLowerCase().includes(term) ||
    permission.model.toLowerCase().includes(term) ||
    permission.value.toLowerCase().includes(term)
  )
}

/**
 * Every permission the server knows, for the cases the module map cannot reach.
 *
 * The map covers 61 of 193 codenames; this is how the other 132 are granted,
 * how an existing role's leftovers are reviewed, and how `rbac.access_admin_portal`
 * gets added — it is a co-requisite inside other modules, never a capability of
 * its own.
 *
 * Rows required by a ticked capability are shown checked and locked: the
 * module view owns them, and letting them be unticked here would put the two
 * views into a disagreement neither could resolve. Everything else edits
 * `extras`, so both views stay two projections of one permission set.
 *
 * Filtering is client-side on purpose. `usePermissionCatalogueQuery` keys on
 * its search term, so passing one through would leave the builder holding a
 * partial catalogue — and the dangerous-permission check reads from that same
 * catalogue. A filtered index would silently stop flagging.
 */
export function PermissionCatalogueView({
  catalogue,
  selection,
  extras,
  disabled,
  onToggleExtra,
}: PermissionCatalogueViewProps) {
  const [search, setSearch] = useState('')

  const requiredByModules = useMemo(() => new Set(expandCapabilities(selection)), [selection])
  const held = useMemo(() => new Set(extras), [extras])

  const groups = useMemo(
    () =>
      orderedGroups(catalogue)
        .map((group) => ({ ...group, permissions: group.permissions.filter((p) => matches(p, search)) }))
        .filter((group) => group.permissions.length > 0),
    [catalogue, search],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="w-[280px]">
          <Input
            size="sm"
            placeholder="Search permissions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Icon name="magnifying-glass" size={14} />}
          />
        </div>
        <span className="text-sm text-ink-subtle">
          {catalogue.count} permissions · {requiredByModules.size} required by the modules above
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center text-sm text-ink-muted shadow-xs">
          No permissions match “{search}”.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.appLabel} className="flex flex-col gap-1 rounded-2xl bg-card p-4 shadow-xs">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-overline text-ink-subtle">{group.label}</h3>
            <div className="flex flex-col">
              {group.permissions.map((permission) => {
                const required = requiredByModules.has(permission.value)
                return (
                  <div key={permission.value} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                    <Checkbox
                      checked={required || held.has(permission.value)}
                      disabled={disabled || required}
                      onChange={(e) => onToggleExtra(permission.value, e.target.checked)}
                      aria-label={permission.name}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-ink-strong">{permission.name}</span>
                        {permission.isDangerous && (
                          <Badge color="red" size="sm" icon={<Icon name="warning" size={11} />}>
                            Dangerous
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-2xs text-ink-subtle">{permission.value}</span>
                      {required && (
                        <span className="text-2xs leading-snug text-ink-subtle">
                          Required by a capability above — untick it there.
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
