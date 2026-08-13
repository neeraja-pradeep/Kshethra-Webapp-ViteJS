import { Icon, Input, Select, type SelectOption } from '@/shared/ui'

import { ORDER_PAYMENT_STATUSES, orderPaymentStatusLabel } from '@/shared/order-feed/domain/order-feed'
import { OrdersDateFilter } from '@/features/orders/presentation/components/OrdersDateFilter'
import { ALL, type OrderDateMode } from '@/features/orders/presentation/lib/orderListFilters'

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All payments' },
  ...ORDER_PAYMENT_STATUSES.map((status) => ({ value: status, label: orderPaymentStatusLabel(status) })),
]

const POOJA_STATUS_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All pooja statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All channels' },
  { value: 'counter', label: 'Counter' },
  { value: 'app', label: 'Mobile app' },
]

/** The six the server matches exactly. Anything else is a `400`. */
const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'All methods' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'cod', label: 'Pay at counter' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Netbanking' },
]

export interface OrdersListFilterBarProps {
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
  onLast7Days: () => void
  onThisMonth: () => void

  paymentStatus: string
  onPaymentStatusChange: (value: string) => void
  poojaStatus: string
  onPoojaStatusChange: (value: string) => void
  channel: string
  onChannelChange: (value: string) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void

  resultLabel: string
}

/**
 * Search + filters, all applied by the server.
 *
 * The date chip filters the **order date** (`created_at`) — when the money came
 * in. Filtering by when the temple has to perform the pooja is the bookings
 * screen's job, and its window runs on a different column.
 */
export function OrdersListFilterBar(props: OrdersListFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-7 pb-3">
      <div className="w-[280px] max-w-full">
        <Input
          size="sm"
          placeholder="Search PO-2041, devotee, phone, receipt, pooja…"
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
        onNext7Days={props.onLast7Days}
        onThisMonth={props.onThisMonth}
      />

      <div className="w-[190px] max-w-full">
        <Select
          size="sm"
          options={PAYMENT_STATUS_OPTIONS}
          value={props.paymentStatus}
          onChange={(e) => props.onPaymentStatusChange(e.target.value)}
        />
      </div>
      <div className="w-[170px] max-w-full">
        <Select
          size="sm"
          options={POOJA_STATUS_OPTIONS}
          value={props.poojaStatus}
          onChange={(e) => props.onPoojaStatusChange(e.target.value)}
        />
      </div>
      <div className="w-[140px] max-w-full">
        <Select
          size="sm"
          options={CHANNEL_OPTIONS}
          value={props.channel}
          onChange={(e) => props.onChannelChange(e.target.value)}
        />
      </div>
      <div className="w-[150px] max-w-full">
        <Select
          size="sm"
          options={PAYMENT_METHOD_OPTIONS}
          value={props.paymentMethod}
          onChange={(e) => props.onPaymentMethodChange(e.target.value)}
        />
      </div>

      <div className="flex-1" />
      <span className="ml-auto whitespace-nowrap text-sm text-ink-subtle">{props.resultLabel}</span>
    </div>
  )
}
