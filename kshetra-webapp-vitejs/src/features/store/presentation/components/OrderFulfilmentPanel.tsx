import { cn } from '@/shared/lib/cn'
import { Button, Icon } from '@/shared/ui'

import { FULFILMENT_STAGES, type FulfilmentStage } from '@/features/store/domain/entities/order'

import { SectionLabel } from './OverlineField'

const STAGE_ICON: Record<FulfilmentStage, string> = {
  Processing: 'hourglass-medium',
  Packed: 'package',
  Shipped: 'truck',
  Delivered: 'check-circle',
  Cancelled: 'prohibit',
}

export interface OrderFulfilmentPanelProps {
  stage: FulfilmentStage
  onAdvance: () => void
  onSetStage: (stage: FulfilmentStage) => void
}

/** Fulfilment control card — advance button plus the four-stage tile picker (or a cancelled notice). */
export function OrderFulfilmentPanel({ stage, onAdvance, onSetStage }: OrderFulfilmentPanelProps) {
  const cancelled = stage === 'Cancelled'
  const idx = FULFILMENT_STAGES.indexOf(stage)
  const canAdvance = !cancelled && idx >= 0 && idx < FULFILMENT_STAGES.length - 1

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <SectionLabel>Fulfilment</SectionLabel>
        <div className="flex-1" />
        {canAdvance && (
          <Button theme="primary" size="sm" iconLeft={<Icon name="arrow-right" size={14} />} onClick={onAdvance}>
            Advance to {FULFILMENT_STAGES[idx + 1]}
          </Button>
        )}
      </div>

      {cancelled && (
        <div className="flex items-center gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2.5 text-sm text-ink">
          <Icon name="prohibit" size={16} className="text-danger" />
          This order was cancelled.
        </div>
      )}

      {!cancelled && (
        <div className="flex flex-wrap items-stretch gap-2">
          {FULFILMENT_STAGES.map((st, i) => {
            const state = i < idx ? 'done' : i === idx ? 'current' : 'todo'
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSetStage(st)}
                className={cn(
                  'flex min-w-[120px] flex-1 items-center gap-2.5 rounded-lg px-3.25 py-2.75 text-left font-sans',
                  state === 'current' ? 'bg-primary-subtle ring-2 ring-inset ring-primary' : 'bg-sunken ring-1 ring-inset ring-stroke-subtle',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                    state === 'todo' ? 'bg-card text-ink-subtle' : 'bg-primary text-white',
                  )}
                >
                  <Icon name={STAGE_ICON[st]} size={13} />
                </span>
                <span className="flex min-w-0 flex-col gap-px">
                  <span className={cn('text-sm font-semibold', state === 'current' ? 'text-primary-subtle-text' : 'text-ink-strong')}>{st}</span>
                  <span className="text-2xs text-ink-subtle">{state === 'current' ? 'Current' : state === 'done' ? 'Done' : 'Pending'}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
