import type { PasswordRequirement } from '@/features/auth/domain/entities/password-requirement'
import { Icon } from '@/shared/ui'

export interface PasswordRequirementListProps {
  requirements: PasswordRequirement[]
}

/** "Password must have…" checklist shown while setting a new password. */
export function PasswordRequirementList({ requirements }: PasswordRequirementListProps) {
  return (
    <div className="flex flex-col gap-1.75 rounded-2xl bg-sunken px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Password must have</div>
      {requirements.map((r) => (
        <div key={r.id} className={r.met ? 'flex items-center gap-2 text-sm text-success' : 'flex items-center gap-2 text-sm text-ink-subtle'}>
          <Icon name={r.met ? 'check-circle' : 'circle'} weight={r.met ? 'fill' : 'regular'} size={16} className="shrink-0" />
          {r.label}
        </div>
      ))}
    </div>
  )
}
