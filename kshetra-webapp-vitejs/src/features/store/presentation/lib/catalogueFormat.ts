import type { BadgeColor } from '@/shared/ui'

import {
  productStatusLabel,
  stockStateLabel,
  type ProductStatus,
  type StockState,
} from '@/features/store/domain/entities/product'

/**
 * Stock badge. The state is the server's — this only chooses how to draw it,
 * and must never re-derive the band from quantity and threshold, or the badge
 * and the filter behind it could disagree.
 */
export function stockStateBadge(state: StockState): { label: string; color: BadgeColor } {
  switch (state) {
    case 'in_stock':
      return { label: stockStateLabel(state), color: 'green' }
    case 'low_stock':
      return { label: stockStateLabel(state), color: 'amber' }
    case 'out_of_stock':
      return { label: stockStateLabel(state), color: 'red' }
  }
}

/** Tailwind background class for the stock tiles' status dot. */
export function stockStateDotClass(state: StockState): string {
  switch (state) {
    case 'in_stock':
      return 'bg-success'
    case 'low_stock':
      return 'bg-warning'
    case 'out_of_stock':
      return 'bg-danger'
  }
}

export function productStatusBadge(status: ProductStatus): { label: string; color: BadgeColor } {
  switch (status) {
    case 'active':
      return { label: productStatusLabel(status), color: 'green' }
    case 'inactive':
      return { label: productStatusLabel(status), color: 'gray' }
    case 'discontinued':
      return { label: productStatusLabel(status), color: 'red' }
  }
}
