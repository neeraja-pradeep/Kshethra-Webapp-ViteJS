import { Icon, Input, Select, type SelectOption } from '@/shared/ui'
import { BookingDateFilter, type BookingDateMode } from '@/features/bookings/presentation/components/BookingDateFilter'

export interface BookingsFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  dateMode: BookingDateMode
  onDateModeChange: (mode: BookingDateMode) => void
  singleDate: string
  onSingleDateChange: (iso: string) => void
  rangeFrom: string
  rangeTo: string
  onRangeChange: (from: string, to: string) => void
  godOptions: readonly SelectOption[]
  god: string
  onGodChange: (value: string) => void
  specialOptions: readonly SelectOption[]
  special: string
  onSpecialChange: (value: string) => void
  poojariOptions: readonly SelectOption[]
  poojari: string
  onPoojariChange: (value: string) => void
  channelOptions: readonly SelectOption[]
  channel: string
  onChannelChange: (value: string) => void
  statusOptions: readonly SelectOption[]
  status: string
  onStatusChange: (value: string) => void
  resultLabel: string
}

/** Search + date/god/type/poojari/channel/status filters + right-aligned result count. */
export function BookingsFilterBar({
  search,
  onSearchChange,
  dateMode,
  onDateModeChange,
  singleDate,
  onSingleDateChange,
  rangeFrom,
  rangeTo,
  onRangeChange,
  godOptions,
  god,
  onGodChange,
  specialOptions,
  special,
  onSpecialChange,
  poojariOptions,
  poojari,
  onPoojariChange,
  channelOptions,
  channel,
  onChannelChange,
  statusOptions,
  status,
  onStatusChange,
  resultLabel,
}: BookingsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3">
      <div className="w-[260px] max-w-full">
        <Input
          size="sm"
          placeholder="Search person, pooja, poojari, god, order…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>
      <BookingDateFilter
        mode={dateMode}
        onModeChange={onDateModeChange}
        singleDate={singleDate}
        onSingleDateChange={onSingleDateChange}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeChange={onRangeChange}
      />
      <div className="w-[150px] max-w-full">
        <Select size="sm" options={godOptions as SelectOption[]} value={god} onChange={(e) => onGodChange(e.target.value)} />
      </div>
      <div className="w-[140px] max-w-full">
        <Select size="sm" options={specialOptions as SelectOption[]} value={special} onChange={(e) => onSpecialChange(e.target.value)} />
      </div>
      <div className="w-[170px] max-w-full">
        <Select size="sm" options={poojariOptions as SelectOption[]} value={poojari} onChange={(e) => onPoojariChange(e.target.value)} />
      </div>
      <div className="w-[140px] max-w-full">
        <Select size="sm" options={channelOptions as SelectOption[]} value={channel} onChange={(e) => onChannelChange(e.target.value)} />
      </div>
      <div className="w-[150px] max-w-full">
        <Select size="sm" options={statusOptions as SelectOption[]} value={status} onChange={(e) => onStatusChange(e.target.value)} />
      </div>
      <div className="flex-1" />
      <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">{resultLabel}</span>
    </div>
  )
}
