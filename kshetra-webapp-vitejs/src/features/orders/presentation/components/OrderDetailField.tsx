import type { ReactNode } from 'react'

export interface OrderDetailFieldProps {
  label: string
  value: ReactNode
}

/** View-mode label:value row — overline caption on the left, the value trailing on the right. */
export function OrderDetailField({ label, value }: OrderDetailFieldProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className="text-right text-base font-semibold text-ink-strong">{value}</span>
    </div>
  )
}
