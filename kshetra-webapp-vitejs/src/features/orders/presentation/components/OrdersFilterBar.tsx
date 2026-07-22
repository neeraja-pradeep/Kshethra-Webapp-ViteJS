import { Icon, Input, Select, type SelectOption } from '@/shared/ui'
import type {
  OrderAgentFilter,
  OrderChannelFilter,
  OrderDateMode,
  OrderPayFilter,
  OrderStatusFilter,
} from '@/features/orders/presentation/lib/orderFilters'
import { OrdersDateFilter } from '@/features/orders/presentation/components/OrdersDateFilter'

const PAY_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All payments' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Refunded', label: 'Refunded' },
  { value: 'Partially Refunded', label: 'Partially Refunded' },
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All booking statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All channels' },
  { value: 'Counter', label: 'Counter' },
  { value: 'Mobile app', label: 'Mobile app' },
]

const AGENT_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All agent codes' },
  { value: 'yes', label: 'Agent code applied' },
  { value: 'no', label: 'No agent code' },
]

export interface OrdersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void

  dateMode: OrderDateMode
  date: string
  from: string
  to: string
  todayIso: string
  onDateModeChange: (mode: OrderDateMode) => void
  onDateChange: (iso: string) => void
  onFromChange: (iso: string) => void
  onToChange: (iso: string) => void
  onAllDates: () => void
  onToday: () => void
  onNext7Days: () => void
  onThisMonth: () => void

  pay: OrderPayFilter
  onPayChange: (value: OrderPayFilter) => void
  status: OrderStatusFilter
  onStatusChange: (value: OrderStatusFilter) => void
  channel: OrderChannelFilter
  onChannelChange: (value: OrderChannelFilter) => void
  agent: OrderAgentFilter
  onAgentChange: (value: OrderAgentFilter) => void

  resultLabel: string
}

/** Search + date/payment/status/channel/agent filters, above the KPI band. */
export function OrdersFilterBar(props: OrdersFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3">
      <div className="w-[280px] max-w-full">
        <Input
          size="sm"
          placeholder="Search ref, devotee, phone, pooja, agent…"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          prefix={<Icon name="magnifying-glass" size={15} />}
        />
      </div>

      <OrdersDateFilter
        mode={props.dateMode}
        date={props.date}
        from={props.from}
        to={props.to}
        todayIso={props.todayIso}
        onModeChange={props.onDateModeChange}
        onDateChange={props.onDateChange}
        onFromChange={props.onFromChange}
        onToChange={props.onToChange}
        onAllDates={props.onAllDates}
        onToday={props.onToday}
        onNext7Days={props.onNext7Days}
        onThisMonth={props.onThisMonth}
      />

      <div className="w-[150px] max-w-full">
        <Select size="sm" options={PAY_OPTIONS} value={props.pay} onChange={(e) => props.onPayChange(e.target.value as OrderPayFilter)} />
      </div>
      <div className="w-[170px] max-w-full">
        <Select size="sm" options={STATUS_OPTIONS} value={props.status} onChange={(e) => props.onStatusChange(e.target.value as OrderStatusFilter)} />
      </div>
      <div className="w-[140px] max-w-full">
        <Select size="sm" options={CHANNEL_OPTIONS} value={props.channel} onChange={(e) => props.onChannelChange(e.target.value as OrderChannelFilter)} />
      </div>
      <div className="w-[170px] max-w-full">
        <Select size="sm" options={AGENT_OPTIONS} value={props.agent} onChange={(e) => props.onAgentChange(e.target.value as OrderAgentFilter)} />
      </div>

      <div className="flex-1" />
      <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">{props.resultLabel}</span>
    </div>
  )
}
