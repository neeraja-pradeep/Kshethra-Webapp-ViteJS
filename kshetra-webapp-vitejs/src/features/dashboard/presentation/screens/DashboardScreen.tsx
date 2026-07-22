import { useNavigate } from 'react-router-dom'

import { Icon } from '@/shared/ui'

import type { LowStockItem } from '@/features/dashboard/domain/entities/low-stock-item'
import type { PoojariStatusTile } from '@/features/dashboard/domain/entities/poojari-status'
import type { QuickAction } from '@/features/dashboard/domain/entities/quick-action'
import { BOOKINGS_TREND } from '@/features/dashboard/presentation/data/bookings-trend.mock'
import { COUNTER_COLLECTIONS } from '@/features/dashboard/presentation/data/counter-collections.mock'
import { STORE_FULFILMENT_STAGES } from '@/features/dashboard/presentation/data/fulfilment-stages.mock'
import { DASHBOARD_LOW_STOCK_LIMIT, STORE_LOW_STOCK } from '@/features/dashboard/presentation/data/low-stock-items.mock'
import { POOJARI_STATUS_TILES } from '@/features/dashboard/presentation/data/poojari-status.mock'
import { DASHBOARD_QUICK_ACTIONS } from '@/features/dashboard/presentation/data/quick-actions.mock'
import { COUNTER_BOOKING_STATS, POOJA_BOOKING_STATS, STORE_ORDER_STATS } from '@/features/dashboard/presentation/data/stat-tiles.mock'

import { CounterCollectionsPanel } from '../components/CounterCollectionsPanel'
import { DashboardSectionCard } from '../components/DashboardSectionCard'
import { LowStockPanel } from '../components/LowStockPanel'
import { PoojaBookingsPanel } from '../components/PoojaBookingsPanel'
import { PoojariStatusTiles } from '../components/PoojariStatusTiles'
import { QuickActionButton } from '../components/QuickActionButton'
import { StoreFulfilmentPanel } from '../components/StoreFulfilmentPanel'
import { formatDashboardDateLine } from '../lib/formatDashboardDate'

const TEMPLE_DATE_LINE = `${formatDashboardDateLine(BOOKINGS_TREND[0].date)} · Sree Nagaraja Kshetram, Peramangalam`

/**
 * Operational snapshot: pooja bookings + next-7-day forecast, store order
 * fulfilment, counter collections, poojari attention items, and low-stock
 * alerts. Route: `/dashboard`.
 */
export function DashboardScreen() {
  const navigate = useNavigate()

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'new-counter-booking') navigate('/counter')
    else if (action.id === 'add-pooja') navigate('/poojas')
    else navigate('/notifications')
  }

  const handlePoojariTile = (_tile: PoojariStatusTile) => navigate('/pooja-bookings')
  const handleLowStockRow = (_item: LowStockItem) => navigate('/store/products')

  return (
    <div className="flex max-w-dashboard flex-col gap-4.5 px-7.5 pb-10 pt-6.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-heading tracking-title leading-tight text-ink-strong">Dashboard</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{TEMPLE_DATE_LINE}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_QUICK_ACTIONS.map((action) => (
            <QuickActionButton key={action.id} action={action} onClick={() => handleQuickAction(action)} />
          ))}
        </div>
      </div>

      <DashboardSectionCard title="Pooja bookings" caption="online + counter combined" actionLabel="View bookings" onAction={() => navigate('/pooja-bookings')}>
        <PoojaBookingsPanel stats={POOJA_BOOKING_STATS} trend={BOOKINGS_TREND} />
      </DashboardSectionCard>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-4">
        <DashboardSectionCard title="Store orders" caption="last 15 orders" actionLabel="View orders" onAction={() => navigate('/store/orders')}>
          <StoreFulfilmentPanel stats={STORE_ORDER_STATS} stages={STORE_FULFILMENT_STAGES} />
        </DashboardSectionCard>

        <DashboardSectionCard title="Counter bookings" actionLabel="Open counter" onAction={() => navigate('/counter')}>
          <CounterCollectionsPanel stats={COUNTER_BOOKING_STATS} collections={COUNTER_COLLECTIONS} />
        </DashboardSectionCard>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-4">
        <DashboardSectionCard title="Poojari management" actionLabel="View bookings" onAction={() => navigate('/pooja-bookings')}>
          <PoojariStatusTiles tiles={POOJARI_STATUS_TILES} onSelect={handlePoojariTile} />
          <div className="flex items-center gap-1.75 text-2xs text-ink-subtle">
            <Icon name="clock-countdown" size={13} />
            Reassigned poojas must be completed within 24 hours.
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Inventory" caption="stock alerts" actionLabel="View products" onAction={() => navigate('/store/products')} gap="3">
          <LowStockPanel items={STORE_LOW_STOCK} limit={DASHBOARD_LOW_STOCK_LIMIT} onSelect={handleLowStockRow} onMore={() => navigate('/store/products')} />
        </DashboardSectionCard>
      </div>
    </div>
  )
}
