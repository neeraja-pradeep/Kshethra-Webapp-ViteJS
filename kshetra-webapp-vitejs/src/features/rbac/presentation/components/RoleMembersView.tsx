import { useMemo, useState } from 'react'

import { Alert, Avatar, Badge, Button, Checkbox, Icon, Input, Modal, Spinner } from '@/shared/ui'
import type { RbacUser } from '@/features/rbac/domain/entities/rbac-user'
import { baseRoleLabel } from '@/features/rbac/presentation/lib/roleDisplay'

export interface RoleMembersViewProps {
  roleLabel: string
  /** False when the role is inactive or built-in — it cannot be handed out. */
  assignable: boolean
  members: readonly RbacUser[]
  membersLoading: boolean
  /** Candidates for the add panel — the searched user list, holders filtered out. */
  candidates: readonly RbacUser[]
  candidatesLoading: boolean
  search: string
  onSearchChange: (value: string) => void
  busy: boolean
  error: string | null
  onClose: () => void
  onAdd: (userIds: readonly number[]) => void
  onRemove: (userIds: readonly number[]) => void
}

function MemberRow({
  user,
  checked,
  onToggle,
}: {
  user: RbacUser
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.75 rounded-lg px-2 py-1.5 hover:bg-hover">
      <Checkbox checked={checked} onChange={onToggle} aria-label={user.username} />
      <Avatar name={user.username} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.25">
        <span className="truncate text-sm font-medium text-ink-strong">{user.username}</span>
        <span className="truncate text-xs text-ink-subtle">{user.email || user.phone || '—'}</span>
      </div>
      <Badge color="gray" size="sm">{baseRoleLabel(user.baseRole)}</Badge>
      {!user.isActive && <Badge color="gray" size="sm">Inactive</Badge>}
    </label>
  )
}

/**
 * Who holds this role, and adding or removing holders in bulk.
 *
 * Assignment is `assign_roles`, a step below authoring the role itself — a
 * supervisor may put someone on the front desk without being able to change
 * what the front desk may do. That is why this panel is reachable for a role
 * the same operator cannot edit.
 */
export function RoleMembersView(props: RoleMembersViewProps) {
  const [selectedMembers, setSelectedMembers] = useState<readonly number[]>([])
  const [adding, setAdding] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<readonly number[]>([])

  const memberIds = useMemo(() => new Set(props.members.map((user) => user.id)), [props.members])
  const addable = useMemo(
    () => props.candidates.filter((user) => !memberIds.has(user.id)),
    [props.candidates, memberIds],
  )

  function toggle(list: readonly number[], id: number): readonly number[] {
    return list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
  }

  return (
    <Modal
      open
      onClose={props.busy ? undefined : props.onClose}
      title={`${props.roleLabel} · ${props.members.length} ${props.members.length === 1 ? 'holder' : 'holders'}`}
      size="lg"
      footer={
        <>
          <Button theme="default" variant="outline" onClick={props.onClose} disabled={props.busy}>
            Close
          </Button>
          {selectedMembers.length > 0 && (
            <Button
              theme="danger"
              loading={props.busy}
              onClick={() => { props.onRemove(selectedMembers); setSelectedMembers([]) }}
            >
              Remove {selectedMembers.length}
            </Button>
          )}
          {props.assignable && (
            <Button
              theme="primary"
              iconLeft={<Icon name="plus" size={15} />}
              disabled={props.busy}
              onClick={() => setAdding((value) => !value)}
            >
              {adding ? 'Done adding' : 'Add holders'}
            </Button>
          )}
        </>
      }
    >
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-auto">
        {props.error && <Alert type="danger">{props.error}</Alert>}

        {!props.assignable && (
          <Alert type="info">
            This role cannot be assigned — built-in roles come from the account’s base role, and an inactive role is
            refused by the server. Existing holders can still be removed.
          </Alert>
        )}

        {adding && (
          <section className="flex flex-col gap-1.5 rounded-xl bg-sunken p-3">
            <Input
              size="sm"
              placeholder="Search users by name, email or phone"
              value={props.search}
              onChange={(e) => props.onSearchChange(e.target.value)}
              prefix={<Icon name="magnifying-glass" size={14} />}
            />
            {props.candidatesLoading ? (
              <div className="flex justify-center py-4"><Spinner size={22} /></div>
            ) : addable.length === 0 ? (
              <p className="m-0 px-2 py-3 text-sm text-ink-subtle">
                {props.search ? 'No users match, or they already hold this role.' : 'Search for someone to add.'}
              </p>
            ) : (
              <div className="flex flex-col">
                {addable.map((user) => (
                  <MemberRow
                    key={user.id}
                    user={user}
                    checked={selectedCandidates.includes(user.id)}
                    onToggle={() => setSelectedCandidates((list) => toggle(list, user.id))}
                  />
                ))}
              </div>
            )}
            {selectedCandidates.length > 0 && (
              <Button
                theme="primary"
                size="sm"
                loading={props.busy}
                onClick={() => { props.onAdd(selectedCandidates); setSelectedCandidates([]) }}
              >
                Give {props.roleLabel} to {selectedCandidates.length}
              </Button>
            )}
          </section>
        )}

        {props.membersLoading ? (
          <div className="flex justify-center py-8"><Spinner size={28} /></div>
        ) : props.members.length === 0 ? (
          <p className="m-0 px-2 py-6 text-center text-sm text-ink-muted">No one holds this role yet.</p>
        ) : (
          <div className="flex flex-col">
            {props.members.map((user) => (
              <MemberRow
                key={user.id}
                user={user}
                checked={selectedMembers.includes(user.id)}
                onToggle={() => setSelectedMembers((list) => toggle(list, user.id))}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
