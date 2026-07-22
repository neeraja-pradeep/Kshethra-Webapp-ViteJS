import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

/** Small uppercase section caption, e.g. "Order", "Fulfilment", "Payment summary". */
export function SectionLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{children}</div>
      {hint && <div className="mt-1 text-2xs text-ink-subtle">{hint}</div>}
    </div>
  )
}

export interface OverlineFieldProps {
  label: ReactNode
  value: ReactNode
  /** Right-align the value (used when paired in a two-column card). */
  alignValue?: 'left' | 'right'
  className?: string
}

/** A read-only "overline label / value" row used throughout view-mode detail cards. */
export function OverlineField({ label, value, alignValue = 'left', className }: OverlineFieldProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <span className="whitespace-nowrap text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className={cn('text-base font-semibold text-ink-strong', alignValue === 'right' && 'text-right')}>{value}</span>
    </div>
  )
}
