import { Switch } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { AgentCodeStatus } from '@/features/agent-codes/domain/entities/agent-code'

export interface AgentCodeStatusCellProps {
  status: AgentCodeStatus
  onToggle: () => void
}

/** Table-row status control: a switch plus the current label. Stops row-click bubbling. */
export function AgentCodeStatusCell({ status, onToggle }: AgentCodeStatusCellProps) {
  return (
    <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch checked={status === 'Active'} size="sm" onChange={onToggle} />
      <span className={cn('min-w-[50px] text-xs', status === 'Active' ? 'text-success' : 'text-ink-subtle')}>{status}</span>
    </span>
  )
}
