import type { ReactNode } from 'react'

interface DetailFieldProps {
  label: string
  editing: boolean
  value: ReactNode
  children: ReactNode
}

/**
 * View-first field: an overline caption + large value when read-only; the real
 * boxed input (passed as children) once editing. See guide §7 view-mode pattern.
 */
export function DetailField({ label, editing, value, children }: DetailFieldProps) {
  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
        <span className="text-lg font-medium text-ink-strong">{value}</span>
      </div>
    )
  }
  return <>{children}</>
}
