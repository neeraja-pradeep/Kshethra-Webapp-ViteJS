import { Icon } from '@/shared/ui'

import type { FulfilmentStage, FulfilmentStageTone } from '@/features/dashboard/domain/entities/fulfilment-stage'
import type { StatTile } from '@/features/dashboard/domain/entities/stat-tile'

import { DashboardStat } from './DashboardStat'

export interface StoreFulfilmentPanelProps {
  stats: StatTile[]
  stages: FulfilmentStage[]
}

const TONE_TEXT: Record<FulfilmentStageTone, string> = {
  primary: 'text-primary',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

const TONE_FILL: Record<FulfilmentStageTone, string> = {
  primary: 'bg-primary',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
}

/**
 * "Store orders" card body: the open/delivered/cancelled stat row above a
 * fulfilment-stage progress list. Each track's fill width is the one
 * genuinely dynamic value — derived from the group's max stage count.
 */
export function StoreFulfilmentPanel({ stats, stages }: StoreFulfilmentPanelProps) {
  const maxCount = Math.max(1, ...stages.map((stage) => stage.count))

  return (
    <>
      <div className="flex gap-6.5">
        {stats.map((stat) => (
          <DashboardStat key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="mt-0.5 flex flex-col gap-2.5">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2.5">
            <Icon name={stage.icon} size={15} className={TONE_TEXT[stage.tone]} />
            <span className="w-[82px] shrink-0 text-sm text-ink">{stage.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-active">
              <div
                className={`h-full rounded-full ${TONE_FILL[stage.tone]}`}
                style={{ width: `${Math.round((100 * stage.count) / maxCount)}%` }}
              />
            </div>
            <span className="w-[22px] text-right text-sm font-semibold tabular-nums text-ink-strong">{stage.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}
