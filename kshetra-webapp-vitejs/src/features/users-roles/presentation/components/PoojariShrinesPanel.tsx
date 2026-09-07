import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Alert, Button, Icon, Spinner } from '@/shared/ui'
import type { PoojariGodOption, PoojariGods } from '@/features/rbac/domain/entities/poojari-god'
import { ActivityPanelHeader } from '@/features/users-roles/presentation/components/ActivityPanelHeader'

export interface PoojariShrinesPanelProps {
  gods: PoojariGods | null
  options: readonly PoojariGodOption[]
  loading: boolean
  optionsLoading: boolean
  saving: boolean
  /** `manage_poojari_gods`. Without it the list is read-only. */
  canEdit: boolean
  error: string | null
  onSave: (godIds: readonly number[]) => void
}

/**
 * Which gods' shrines this poojari keeps.
 *
 * The list is replaced wholesale — the endpoint has no per-row write — so the
 * editor holds a draft and saves all of it at once, and Cancel simply drops the
 * draft.
 *
 * The empty state is the part worth getting right: **no gods assigned does not
 * mean they see nothing, it means they see everything.** Every poojari was
 * unscoped before this list existed, so the server reads "no rows" as *no
 * scoping applies*. Assigning the first god is what switches scoping on;
 * clearing the list switches it back off. A bare "0 gods" would read as a
 * lockout and get somebody's roster wrongly "fixed".
 */
export function PoojariShrinesPanel({
  gods,
  options,
  loading,
  optionsLoading,
  saving,
  canEdit,
  error,
  onSave,
}: PoojariShrinesPanelProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<readonly number[]>([])

  const assigned = useMemo(() => gods?.assignments ?? [], [gods])

  /**
   * The draft mirrors the server while the editor is closed, so opening it
   * always starts from what is actually saved — and a save landing underneath
   * re-seeds rather than leaving a stale draft behind.
   */
  useEffect(() => {
    if (!editing) setDraft(assigned.map((assignment) => assignment.god.id))
  }, [editing, assigned])

  const toggle = (godId: number) =>
    setDraft((current) => (current.includes(godId) ? current.filter((id) => id !== godId) : [...current, godId]))

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <ActivityPanelHeader
        icon={<Icon name="flame" size={18} />}
        title={`Shrines kept (${assigned.length})`}
        trailing={
          canEdit && !editing && !loading ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              {assigned.length > 0 ? 'Edit' : 'Assign gods'}
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert type="danger" icon={<Icon name="warning" size={16} />}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex min-h-20 items-center justify-center">
          <Spinner size={24} />
        </div>
      ) : editing ? (
        <>
          {optionsLoading ? (
            <div className="flex min-h-20 items-center justify-center">
              <Spinner size={24} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {options.map((option) => {
                const picked = draft.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={saving}
                    onClick={() => toggle(option.id)}
                    className={cn(
                      'inline-flex items-center gap-1.25 rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-shadow duration-140 ease-ks',
                      picked
                        ? 'bg-primary text-primary-contrast shadow-xs'
                        : 'bg-sunken text-ink shadow-[inset_0_0_0_0.5px_var(--border-default)] hover:shadow-card-hover',
                    )}
                  >
                    {picked && <Icon name="check" size={11} weight="bold" />}
                    {option.name}
                  </button>
                )
              })}
            </div>
          )}

          <p className="m-0 text-xs leading-snug text-ink-subtle">
            {draft.length === 0
              ? 'With no god selected this poojari is unscoped — they see every shrine’s bookings, which is how an unassigned poojari has always worked.'
              : `Scoped to ${draft.length} shrine${draft.length === 1 ? '' : 's'}. They will only see these gods’ bookings in the poojari app.`}
          </p>

          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={() => onSave(draft)}>
              Save shrines
            </Button>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : assigned.length === 0 ? (
        <div className="flex items-start gap-2.25 text-sm text-ink-muted">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-info" />
          <span>
            No shrine of their own — this poojari sees <strong className="font-medium text-ink">every god’s</strong>{' '}
            bookings. Assigning a god narrows them to it.
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {assigned.map((assignment) => (
              <span
                key={assignment.god.id}
                title={
                  assignment.assignedByName
                    ? `Assigned by ${assignment.assignedByName}`
                    : 'Chosen by the poojari themselves'
                }
                className="inline-flex items-center rounded-full bg-primary-subtle px-3 py-1.5 text-xs font-medium text-primary-subtle-text"
              >
                {assignment.god.name}
              </span>
            ))}
          </div>
          <p className="m-0 text-xs leading-snug text-ink-subtle">
            The poojari app shows them these gods’ bookings only. Clearing the list returns them to seeing every shrine.
          </p>
        </>
      )}
    </div>
  )
}
