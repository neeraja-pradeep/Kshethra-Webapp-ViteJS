export interface DetailFieldRowProps {
  label: string
  value: string
  /** DC source renders audit dates at "medium" weight, everything else "semibold". */
  weight?: 'medium' | 'semibold'
}

/** View-mode detail row: overline label left, value right (see guide §7). */
export function DetailFieldRow({ label, value, weight = 'semibold' }: DetailFieldRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className={weight === 'medium' ? 'text-right text-base font-medium text-ink-strong' : 'text-right text-base font-semibold text-ink-strong'}>{value}</span>
    </div>
  )
}
