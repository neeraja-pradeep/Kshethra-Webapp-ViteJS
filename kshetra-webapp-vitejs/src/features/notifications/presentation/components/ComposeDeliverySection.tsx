import { Icon, Input } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { NotificationDelivery } from '@/features/notifications/domain/entities/notification'
import { ComposeViewField } from '@/features/notifications/presentation/components/ComposeViewField'
import { formatNotificationTime } from '@/features/notifications/presentation/lib/notification-format'

interface ComposeDeliverySectionProps {
  mode: 'view' | 'edit'
  delivery: NotificationDelivery
  schedDate: string
  schedTime: string
  schedError: boolean
  recipientEstimateLabel: string
  onDeliveryChange: (value: NotificationDelivery) => void
  onSchedDateChange: (value: string) => void
  onSchedTimeChange: (value: string) => void
}

/** Send-now / schedule card, plus the always-visible recipient estimate. */
export function ComposeDeliverySection({
  mode,
  delivery,
  schedDate,
  schedTime,
  schedError,
  recipientEstimateLabel,
  onDeliveryChange,
  onSchedDateChange,
  onSchedTimeChange,
}: ComposeDeliverySectionProps) {
  const isSchedule = delivery === 'schedule'
  const deliveryValue = isSchedule
    ? schedDate && schedTime
      ? `Scheduled for ${formatNotificationTime(`${schedDate} ${schedTime}`)}`
      : 'Scheduled'
    : 'Send immediately'

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Delivery</span>

      {mode === 'edit' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <DeliveryOptionButton active={!isSchedule} icon="lightning" label="Send now" onClick={() => onDeliveryChange('now')} />
            <DeliveryOptionButton active={isSchedule} icon="clock" label="Schedule" onClick={() => onDeliveryChange('schedule')} />
          </div>
          {isSchedule && (
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="w-[170px]">
                <Input label="Date" type="date" value={schedDate} onChange={(e) => onSchedDateChange(e.target.value)} />
              </div>
              <div className="w-[140px]">
                <Input label="Time" type="time" value={schedTime} onChange={(e) => onSchedTimeChange(e.target.value)} />
              </div>
              {schedError && <span className="pb-2.25 text-xs text-danger">Pick a date and time.</span>}
            </div>
          )}
        </>
      ) : (
        <ComposeViewField label="Delivery" value={deliveryValue} />
      )}

      <div className="flex items-center gap-2.25 rounded-md border-[0.5px] border-info-border bg-info-surface px-3.25 py-2.75">
        <Icon name="users-three" size={17} className="text-info" />
        <span className="text-sm text-ink">
          Estimated recipients: <span className="font-bold tabular-nums">{recipientEstimateLabel}</span>
        </span>
      </div>
    </section>
  )
}

interface DeliveryOptionButtonProps {
  active: boolean
  icon: string
  label: string
  onClick: () => void
}

function DeliveryOptionButton({ active, icon, label, onClick }: DeliveryOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-[150px] flex-1 cursor-pointer items-center gap-2.5 rounded-lg border-none px-3.5 py-3 text-left font-sans text-sm font-medium',
        active ? 'bg-primary-subtle text-primary-subtle-text shadow-[inset_0_0_0_1.5px_var(--color-primary)]' : 'bg-card text-ink-strong shadow-[inset_0_0_0_1px_var(--border-default)]',
      )}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}
