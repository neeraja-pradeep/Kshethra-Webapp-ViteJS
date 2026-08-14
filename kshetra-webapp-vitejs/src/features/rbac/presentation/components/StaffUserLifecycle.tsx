import { useState } from 'react'

import { Button, Icon, Input, Modal } from '@/shared/ui'
import type { RbacUser } from '@/features/rbac/domain/entities/rbac-user'

export interface StaffUserLifecycleProps {
  user: RbacUser
  busy: boolean
  /** False for an operator without `manage_users` + `change_customuser`. */
  canManage: boolean
  onDeactivate: () => void
  onActivate: () => void
  onSetPassword: (password: string) => void
}

/**
 * Deactivate, reactivate, and reset a password.
 *
 * There is no delete. `DELETE users/{id}/` deactivates and keeps the row, so a
 * clerk who took counter payments stays attributable — offering "Delete"
 * beside "Deactivate" would be two buttons for one outcome, one of them
 * lying about what it does.
 */
export function StaffUserLifecycle({ user, busy, canManage, onDeactivate, onActivate, onSetPassword }: StaffUserLifecycleProps) {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [password, setPassword] = useState('')

  if (!canManage) return null

  const tooShort = password.length > 0 && password.length < 8

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-semibold text-ink-strong">Account lifecycle</div>
        <div className="mt-0.5 text-xs leading-snug text-ink-subtle">
          Deactivating revokes sign-in immediately. The account and its history are kept, and it can be reactivated.
        </div>
      </div>

      <Button
        theme="default"
        variant="outline"
        disabled={busy}
        onClick={() => setPasswordOpen(true)}
        iconLeft={<Icon name="key" size={15} />}
      >
        Set password
      </Button>

      {user.isActive ? (
        <Button
          theme="danger"
          variant="outline"
          disabled={busy}
          onClick={onDeactivate}
          iconLeft={<Icon name="pause-circle" size={15} />}
        >
          Deactivate
        </Button>
      ) : (
        <Button
          theme="default"
          variant="outline"
          disabled={busy}
          onClick={onActivate}
          iconLeft={<Icon name="play-circle" size={15} />}
        >
          Reactivate
        </Button>
      )}

      <Modal
        open={passwordOpen}
        onClose={() => { setPasswordOpen(false); setPassword('') }}
        title={`Set a new password for ${user.username}`}
        size="sm"
        footer={
          <>
            <Button theme="default" variant="outline" onClick={() => { setPasswordOpen(false); setPassword('') }}>
              Cancel
            </Button>
            <Button
              theme="primary"
              loading={busy}
              disabled={password.length < 8}
              onClick={() => { onSetPassword(password); setPasswordOpen(false); setPassword('') }}
            >
              Set password
            </Button>
          </>
        }
      >
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters. The server applies its own rules too."
          error={tooShort ? 'Use at least 8 characters.' : undefined}
        />
      </Modal>
    </div>
  )
}
