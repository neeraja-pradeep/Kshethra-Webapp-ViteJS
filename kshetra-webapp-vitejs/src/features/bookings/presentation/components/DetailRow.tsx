import type { ReactNode } from 'react'

export interface DetailRowProps {
  label: string
  children: ReactNode
}

/** View-mode label:value row — overline caption on the left, value leading on the right. */
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className="text-right text-base font-medium text-ink-strong">{children}</span>
    </div>
  )
}
