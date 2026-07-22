import { Icon } from '@/shared/ui'
import { formatCount } from '@/shared/lib/format'

import { FieldHint } from './FieldHint'

interface TrackPlaysStatProps {
  plays: number
  editable: boolean
}

/** Read-only lifetime play count reported by the app (no editable field maps to it). */
export function TrackPlaysStat({ plays, editable }: TrackPlaysStatProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-sunken text-ink-muted">
        <Icon name="play-circle" size={18} />
      </span>
      <div>
        <div className="text-base font-bold tabular-nums text-ink-strong">{formatCount(plays)}</div>
        <FieldHint editable={editable}>Plays (from app)</FieldHint>
      </div>
    </div>
  )
}
