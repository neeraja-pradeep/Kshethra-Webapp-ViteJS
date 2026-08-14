import { Badge, Checkbox, Icon } from '@/shared/ui'
import type { ModuleCapability, ProductModule, ResolvedModules } from '@/features/rbac/domain/entities/module-map'
import { MODULE_MAP } from '@/features/rbac/domain/entities/module-map'
import { dangerousIn, permissionName, type PermissionIndex } from '@/features/rbac/presentation/lib/permissionLookup'

export interface ModuleCapabilityGridProps {
  /** What the role actually resolves to — the source of every checkbox. */
  resolved: ResolvedModules
  /** What the operator explicitly ticked, per module. */
  selection: Readonly<Record<string, readonly string[]>>
  index: PermissionIndex
  disabled: boolean
  onToggle: (moduleKey: string, capabilityKey: string) => void
  /** Ticks or clears every capability in one module. */
  onSelectAll: (moduleKey: string, selectAll: boolean) => void
}

function grantsSummary(capability: ModuleCapability, index: PermissionIndex): string {
  return capability.permissions.map((codename) => `${permissionName(codename, index)} (${codename})`).join('\n')
}

function CapabilityRow({
  module,
  capability,
  granted,
  ticked,
  index,
  disabled,
  onToggle,
}: {
  module: ProductModule
  capability: ModuleCapability
  granted: boolean
  ticked: boolean
  index: PermissionIndex
  disabled: boolean
  onToggle: () => void
}) {
  const dangerous = dangerousIn(capability.permissions, index)
  // Held without having been ticked: another capability supplies the same
  // codenames. Shown as held because the server would allow the call.
  const implied = granted && !ticked

  return (
    <div className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
      <Checkbox
        checked={granted}
        disabled={disabled}
        onChange={onToggle}
        aria-label={`${module.label} — ${capability.label}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-ink-strong">{capability.label}</span>
          <span
            className="cursor-help font-mono text-2xs text-ink-subtle"
            title={grantsSummary(capability, index)}
          >
            {capability.key}
          </span>
          {dangerous.length > 0 && (
            <Badge color="red" size="sm" icon={<Icon name="warning" size={11} />}>
              Dangerous
            </Badge>
          )}
          {implied && (
            <Badge color="blue" size="sm">
              Already granted
            </Badge>
          )}
        </div>
        {implied && (
          <span className="text-2xs leading-snug text-ink-subtle">
            Another ticked capability grants the same permissions, so this comes with it.
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * The 13 modules and their capabilities.
 *
 * **Checkboxes render the resolution, not the ticks.** A capability whose
 * codenames are all present shows as held even when it was never ticked
 * directly — because it genuinely is held, and the server will act on it. The
 * contract's own rule is to trust the boolean rather than reconstruct it, and
 * a builder that drew the operator's ticks instead would promise a restriction
 * that does not exist.
 *
 * Codenames are shared across modules, so this is not rare: granting the
 * counter desk plus pooja-order reads also grants raising a pooja order.
 */
export function ModuleCapabilityGrid({ resolved, selection, index, disabled, onToggle, onSelectAll }: ModuleCapabilityGridProps) {
  return (
    <div className="flex flex-col gap-3">
      {MODULE_MAP.map((module) => {
        const capabilities = resolved[module.key] ?? {}
        const grantedCount = module.capabilities.filter((capability) => capabilities[capability.key]).length
        const allGranted = grantedCount === module.capabilities.length
        const dangerousInModule = dangerousIn(
          module.capabilities.flatMap((capability) => capability.permissions),
          index,
        )

        return (
          <section key={module.key} className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 shadow-xs">
            <header className="flex items-start gap-3">
              {/* Whole-module grant. Reads the resolution like every other box,
                  so a module already fully granted from elsewhere shows ticked. */}
              <Checkbox
                checked={allGranted}
                indeterminate={grantedCount > 0 && !allGranted}
                disabled={disabled}
                onChange={() => onSelectAll(module.key, !allGranted)}
                aria-label={allGranted ? `Clear all in ${module.label}` : `Select all in ${module.label}`}
              />
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-sm font-semibold text-ink-strong">{module.label}</h3>
                <p className="m-0 mt-0.5 text-xs leading-snug text-ink-subtle">{module.description}</p>
              </div>
              {dangerousInModule.length > 0 && (
                <Badge color="red" size="sm" icon={<Icon name="warning" size={11} />}>
                  {dangerousInModule.length}
                </Badge>
              )}
              <Badge color={grantedCount > 0 ? 'green' : 'gray'} size="sm">
                {grantedCount} / {module.capabilities.length}
              </Badge>
            </header>

            <div className="flex flex-col">
              {module.capabilities.map((capability) => (
                <CapabilityRow
                  key={capability.key}
                  module={module}
                  capability={capability}
                  granted={capabilities[capability.key] === true}
                  ticked={(selection[module.key] ?? []).includes(capability.key)}
                  index={index}
                  disabled={disabled}
                  onToggle={() => onToggle(module.key, capability.key)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
