import { Icon } from '@/shared/ui'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'

export interface ModuleAccessPanelProps {
  /** True for the admin role — shows the "full access" banner instead of a plain module list. */
  isAdmin: boolean
  modules: readonly string[]
}

/** Manager/admin detail panel: the fixed set of modules the role can access. */
export function ModuleAccessPanel({ isAdmin, modules }: ModuleAccessPanelProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader icon={<Icon name="squares-four" size={18} />} title="Module access" />

      {isAdmin && (
        <div className="flex items-center gap-2.25 rounded-lg border border-primary-border bg-primary-subtle px-3.5 py-2.75 text-sm font-medium text-primary-subtle-text">
          <Icon name="shield-check" size={17} />
          Full access to all modules, including user management.
        </div>
      )}

      <div className="flex flex-wrap gap-1.75">
        {modules.map((name) => (
          <span key={name} className="inline-flex items-center gap-1.75 rounded-md bg-sunken px-3 py-1.5 text-sm font-medium text-ink shadow-xs">
            <Icon name="check-circle" size={14} color="var(--color-success)" />
            {name}
          </span>
        ))}
      </div>

      <div className="text-xs leading-snug text-ink-subtle">Access is fixed by role and can&apos;t be edited here.</div>
    </div>
  )
}
