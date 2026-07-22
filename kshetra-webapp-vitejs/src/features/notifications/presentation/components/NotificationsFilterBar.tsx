import { Icon, Input, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'

import type { NotificationAudience, NotificationStatus } from '@/features/notifications/domain/entities/notification'

export type NotificationsStatusFilter = 'all' | NotificationStatus
export type NotificationsTargetFilter = 'any' | NotificationAudience
export type NotificationsBannerFilter = 'any' | 'yes' | 'no'

interface NotificationsFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: NotificationsStatusFilter
  onStatusChange: (value: NotificationsStatusFilter) => void
  target: NotificationsTargetFilter
  onTargetChange: (value: NotificationsTargetFilter) => void
  banner: NotificationsBannerFilter
  onBannerChange: (value: NotificationsBannerFilter) => void
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Sent', label: 'Sent' },
]
const TARGET_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'All targets' },
  { value: 'all', label: 'All users' },
  { value: 'nakshatra', label: 'By nakshatra' },
]
const BANNER_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Banner: any' },
  { value: 'yes', label: 'With banner' },
  { value: 'no', label: 'No banner' },
]

/** Search box + status/target/banner filters above the notifications table. */
export function NotificationsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  target,
  onTargetChange,
  banner,
  onBannerChange,
}: NotificationsFilterBarProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 px-7 pb-3">
      <div className="w-[280px] max-w-full">
        <Input
          size="sm"
          placeholder="Search title, description, target…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>
      <div className="w-[170px]">
        <Select
          size="sm"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as NotificationsStatusFilter)}
        />
      </div>
      <div className="w-[160px]">
        <Select
          size="sm"
          options={TARGET_OPTIONS}
          value={target}
          onChange={(e) => onTargetChange(e.target.value as NotificationsTargetFilter)}
        />
      </div>
      <div className="w-[150px]">
        <Select
          size="sm"
          options={BANNER_OPTIONS}
          value={banner}
          onChange={(e) => onBannerChange(e.target.value as NotificationsBannerFilter)}
        />
      </div>
    </div>
  )
}
