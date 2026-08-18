import { Alert, Icon, Spinner } from '@/shared/ui'

import type { DevoteeDetail } from '@/features/devotees/domain/entities/devotee'

import { DevoteeAccountCard } from './DevoteeAccountCard'
import { DevoteeBookingHistoryCard } from './DevoteeBookingHistoryCard'
import { DevoteeDetailHeader } from './DevoteeDetailHeader'
import { DevoteeFamilyCard } from './DevoteeFamilyCard'
import { DevoteeLifecycleCard } from './DevoteeLifecycleCard'

export interface DevoteeDetailPanelProps {
  /** Null while the detail call is in flight or has failed. */
  devotee: DevoteeDetail | null
  /** The row that was clicked, so the header can name the account before its detail lands. */
  fallbackName: string
  loading: boolean
  loadError: string | null
  canSuspend: boolean
  busy: boolean
  onBack: () => void
  onSuspend: () => void
  onReinstate: () => void
  onOpenPoojaOrder?: (orderId: number) => void
  onOpenShopOrder?: (orderId: number) => void
}

/** Full-screen account detail: account and family cards, recent activity, lifecycle. */
export function DevoteeDetailPanel({
  devotee,
  fallbackName,
  loading,
  loadError,
  canSuspend,
  busy,
  onBack,
  onSuspend,
  onReinstate,
  onOpenPoojaOrder,
  onOpenShopOrder,
}: DevoteeDetailPanelProps) {
  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DevoteeDetailHeader name={devotee?.name ?? fallbackName} status={devotee?.status ?? null} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4 p-6 pb-14">
          {loadError && (
            <Alert type="danger" icon={<Icon name="warning" size={16} />}>
              {loadError}
            </Alert>
          )}

          {loading && (
            <div className="flex min-h-60 items-center justify-center">
              <Spinner size={36} />
            </div>
          )}

          {devotee && (
            <>
              <div className="flex flex-wrap items-start gap-4">
                <DevoteeAccountCard devotee={devotee} />
                <DevoteeFamilyCard devotee={devotee} />
              </div>

              <DevoteeBookingHistoryCard
                devotee={devotee}
                onOpenPoojaOrder={onOpenPoojaOrder}
                onOpenShopOrder={onOpenShopOrder}
              />

              <DevoteeLifecycleCard
                devotee={devotee}
                canSuspend={canSuspend}
                busy={busy}
                onSuspend={onSuspend}
                onReinstate={onReinstate}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
