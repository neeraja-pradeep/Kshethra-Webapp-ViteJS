import type { FulfilmentStage } from '@/features/dashboard/domain/entities/fulfilment-stage'

/**
 * Fulfilment-stage distribution across the store's last 15 orders. Copied
 * verbatim from the DC prototype's `STORE_STAGES` seed.
 */
export const STORE_FULFILMENT_STAGES: FulfilmentStage[] = [
  { label: 'Processing', icon: 'hourglass-medium', tone: 'primary', count: 3 },
  { label: 'Packed', icon: 'package', tone: 'warning', count: 1 },
  { label: 'Shipped', icon: 'truck', tone: 'info', count: 3 },
  { label: 'Delivered', icon: 'check-circle', tone: 'success', count: 6 },
]
