import type { LowStockItem } from '@/features/dashboard/domain/entities/low-stock-item'

/**
 * Active products at or below the store's low-stock threshold (10 units).
 * Copied verbatim from the DC prototype's `STORE_LOW_STOCK` seed. The
 * dashboard shows only the first 4; the rest surface a "+N more" link.
 */
export const STORE_LOW_STOCK: LowStockItem[] = [
  { sku: 'INC-003', name: 'Nag Champa Incense', stock: 0 },
  { sku: 'RUD-004', name: 'Rudraksha Bracelet', stock: 0 },
  { sku: 'IDL-003', name: 'Panchaloha Nataraja (6in)', stock: 3 },
  { sku: 'IDL-002', name: 'Marble Lakshmi Idol', stock: 4 },
  { sku: 'LMP-004', name: 'Akhand Jyoti Oil Lamp', stock: 6 },
  { sku: 'INC-002', name: 'Loban Dhoop Cones', stock: 8 },
  { sku: 'RUD-003', name: 'Sphatik Crystal Mala', stock: 9 },
]

/** How many low-stock rows the dashboard card surfaces before "+N more". */
export const DASHBOARD_LOW_STOCK_LIMIT = 4
