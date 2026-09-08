import { Switch } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { AgentCodeStatus } from '@/features/agent-codes/domain/entities/agent-code'
import { agentCodeStatusLabel } from '@/features/agent-codes/presentation/lib/agentCodeDisplay'

export interface AgentCodeStatusCellProps {
  status: AgentCodeStatus
  onToggle: () => void
}

/** Table-row status control: a switch plus the current label. Stops row-click bubbling. */
export function AgentCodeStatusCell({ status, onToggle }: AgentCodeStatusCellProps) {
  return (
    <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch checked={status === 'active'} size="sm" onChange={onToggle} />
      <span className={cn('min-w-[50px] text-xs', status === 'active' ? 'text-success' : 'text-ink-subtle')}>
        {agentCodeStatusLabel(status)}
      </span>
    </span>
  )
}
