import { Button, Icon } from '@/shared/ui'

import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'

export interface DevoteeLifecycleCardProps {
  devotee: DevoteeDetail
  /** `rbac.manage_devotees`. Reports Manager reads this screen but writes nothing. */
  canSuspend: boolean
  busy: boolean
  onSuspend: () => void
  onReinstate: () => void
}

/**
 * Suspend / reinstate — the only write this screen has.
 *
 * There is no delete, and the note says why rather than leaving a disabled
 * button to imply one might become available: a devotee who paid at the counter
 * has to stay attributable, so what suspension revokes is sign-in and nothing
 * else. The family, the bookings and the receipts all stay where they are, and
 * the row keeps its figures.
 */
export function DevoteeLifecycleCard({ devotee, canSuspend, busy, onSuspend, onReinstate }: DevoteeLifecycleCardProps) {
  const suspended = devotee.status === 'suspended'
  const note = suspended
    ? 'Sign-in is revoked. The account, its family and its history are intact — reinstating restores access.'
    : 'Suspending revokes sign-in only. Accounts are never deleted: their orders and receipts have to stay attributable.'

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <div className="text-sm font-semibold text-ink-strong">Account lifecycle</div>
        <div className="mt-0.5 text-2xs leading-snug text-ink-subtle">{note}</div>
      </div>
      {canSuspend &&
        (suspended ? (
          <Button theme="primary" variant="outline" disabled={busy} onClick={onReinstate}>
            <Icon name="play-circle" size={15} />
            Reinstate
          </Button>
        ) : (
          <Button theme="danger" variant="outline" disabled={busy} onClick={onSuspend}>
            <Icon name="pause-circle" size={15} />
            Suspend account
          </Button>
        ))}
    </div>
  )
}
