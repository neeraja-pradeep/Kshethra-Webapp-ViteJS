import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'

import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'

const METHOD_ICON: Record<PaymentMethod, string> = {
  Cash: 'money',
  Card: 'credit-card',
  UPI: 'device-mobile',
  'Net banking': 'bank',
}

export interface MethodTileProps {
  method: PaymentMethod
  selected: boolean
  onSelect: () => void
}

/** Payment-method picker tile: hairline-ringed, selected = maroon ring + warm tint. */
export function MethodTile({ method, selected, onSelect }: MethodTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3.5 py-3.25 text-left text-base font-medium transition-[background,box-shadow] duration-120 ease-ks',
        selected
          ? 'bg-primary-subtle text-primary-subtle-text ring-2 ring-inset ring-primary'
          : 'bg-card text-ink ring-1 ring-inset ring-stroke-strong hover:bg-hover',
      )}
    >
      <Icon name={METHOD_ICON[method]} size={20} />
      {method}
    </button>
  )
}
