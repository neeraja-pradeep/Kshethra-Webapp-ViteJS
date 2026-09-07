import { useNavigate } from 'react-router-dom'

import { toFailure } from '@/core/error/result'
import { Alert, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import { useDashboardQuery } from '@/features/dashboard/application/queries/useDashboardQuery'
import { useLowStockQuery } from '@/features/dashboard/application/queries/useLowStockQuery'
import type { LowStockItem } from '@/features/dashboard/domain/entities/low-stock-item'
import type { PoojariStatusTile } from '@/features/dashboard/domain/entities/poojari-status'
import type { QuickAction } from '@/features/dashboard/domain/entities/quick-action'
import { DASHBOARD_LOW_STOCK_LIMIT } from '@/features/dashboard/presentation/lib/dashboardLimits'
import { DASHBOARD_QUICK_ACTIONS } from '@/features/dashboard/presentation/data/quick-actions'
import {
  toCounterBookingStats,
  toFulfilmentStages,
  toPoojaBookingStats,
  toPoojariStatusTiles,
  toStoreOrderStats,
} from '@/features/dashboard/presentation/lib/toDashboardView'

import { CounterCollectionsPanel } from '../components/CounterCollectionsPanel'
import { DashboardSectionCard } from '../components/DashboardSectionCard'
import { DevoteesSummaryTiles } from '../components/DevoteesSummaryTiles'
import { LowStockPanel } from '../components/LowStockPanel'
import { PoojaBookingsPanel } from '../components/PoojaBookingsPanel'
import { PoojariStatusTiles } from '../components/PoojariStatusTiles'
import { QuickActionButton } from '../components/QuickActionButton'
import { StoreFulfilmentPanel } from '../components/StoreFulfilmentPanel'
import { formatDashboardDateLine } from '../lib/formatDashboardDate'

/** No backend field exposes these — see the dashboard API doc. */
const TEMPLE_LOCATION = 'Sree Nagaraja Kshetram, Peramangalam'

/**
 * Operational snapshot: pooja bookings + next-7-day forecast, store order
 * fulfilment, counter collections, poojari attention items, devotee sign-ups
 * and low-stock alerts. Route: `/dashboard`.
 *
 * Every card but the last comes from a single `admin/dashboard/data/` call, so
 * the whole screen is counted against one server-side date — a load served
 * across midnight cannot show one card's today beside another's tomorrow. The
 * inventory card is the exception: the store's own product list serves it, so
 * "low" means the same thing here as on the screen the card links to.
 */
export function DashboardScreen() {
  const navigate = useNavigate()
  const can = useCan()

  const dashboardQuery = useDashboardQuery()
  const lowStock = useLowStockQuery(can(PERMISSIONS.viewProduct))

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'new-counter-booking') navigate('/counter')
    else if (action.id === 'add-pooja') navigate('/poojas')
    else navigate('/notifications')
  }

  const handlePoojariTile = (_tile: PoojariStatusTile) => navigate('/pooja-bookings')
  const handleLowStockRow = (_item: LowStockItem) => navigate('/store/products')
  const handleDevoteeTile = (status: 'active' | 'suspended' | null) =>
    navigate(status ? `/devotees?status=${status}` : '/devotees')

  if (dashboardQuery.isPending) {
    return (
      <div className="flex min-h-100 items-center justify-center px-7.5 py-6.5">
        <Spinner size={40} />
      </div>
    )
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="flex max-w-dashboard flex-col gap-4.5 px-7.5 pb-10 pt-6.5">
        <Alert type="danger" icon={<Icon name="warning" size={16} />}>
          {toFailure(dashboardQuery.error)?.message ?? 'The dashboard could not be loaded.'}
        </Alert>
      </div>
    )
  }

  const snapshot = dashboardQuery.data
  const dateLine = `${formatDashboardDateLine(snapshot.date)} · ${TEMPLE_LOCATION}`

  return (
    <div className="flex max-w-dashboard flex-col gap-4.5 px-7.5 pb-10 pt-6.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-heading tracking-title leading-tight text-ink-strong">Dashboard</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{dateLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_QUICK_ACTIONS.map((action) => (
            <QuickActionButton key={action.id} action={action} onClick={() => handleQuickAction(action)} />
          ))}
        </div>
      </div>

      <DashboardSectionCard title="Pooja bookings" caption="online + counter combined" actionLabel="View bookings" onAction={() => navigate('/pooja-bookings')}>
        <PoojaBookingsPanel stats={toPoojaBookingStats(snapshot.poojaBookings)} trend={[...snapshot.poojaBookings.trend]} />
      </DashboardSectionCard>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-4">
        <DashboardSectionCard title="Store orders" caption={`last ${snapshot.storeOrders.window} orders`} actionLabel="View orders" onAction={() => navigate('/store/orders')}>
          <StoreFulfilmentPanel stats={toStoreOrderStats(snapshot.storeOrders)} stages={toFulfilmentStages(snapshot.storeOrders)} />
        </DashboardSectionCard>

        <DashboardSectionCard title="Counter bookings" actionLabel="Open counter" onAction={() => navigate('/counter')}>
          <CounterCollectionsPanel stats={toCounterBookingStats(snapshot.counterBookings)} collections={[...snapshot.counterBookings.collections]} />
        </DashboardSectionCard>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-4">
        <DashboardSectionCard title="Poojari management" actionLabel="View bookings" onAction={() => navigate('/pooja-bookings')}>
          <PoojariStatusTiles tiles={toPoojariStatusTiles(snapshot.poojariManagement)} onSelect={handlePoojariTile} />
          <div className="flex items-center gap-1.75 text-2xs text-ink-subtle">
            <Icon name="clock-countdown" size={13} />
            Reassigned poojas must be completed within 24 hours.
          </div>
        </DashboardSectionCard>

        {/* `null` devotees means the caller lacks `view_devotees` — hide the card, never render it as zero. */}
        {snapshot.devotees && (
          <DashboardSectionCard title="Devotees" caption="app sign-ups" actionLabel="View devotees" onAction={() => navigate('/devotees')}>
            <DevoteesSummaryTiles summary={snapshot.devotees} onSelect={handleDevoteeTile} />
          </DashboardSectionCard>
        )}
      </div>

      {can(PERMISSIONS.viewProduct) && (
        <DashboardSectionCard title="Inventory" caption="stock alerts" actionLabel="View products" onAction={() => navigate('/store/products')} gap="3">
          {lowStock.isPending ? (
            <div className="flex min-h-25 items-center justify-center">
              <Spinner size={24} />
            </div>
          ) : lowStock.isError ? (
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {toFailure(lowStock.error)?.message ?? 'Stock alerts could not be loaded.'}
            </Alert>
          ) : (
            <LowStockPanel
              items={lowStock.items}
              limit={DASHBOARD_LOW_STOCK_LIMIT}
              onSelect={handleLowStockRow}
              onMore={() => navigate('/store/products')}
            />
          )}
        </DashboardSectionCard>
      )}
    </div>
  )
}
