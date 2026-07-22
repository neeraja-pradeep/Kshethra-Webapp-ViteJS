import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg'
export type ProgressColor = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface ProgressBarProps {
  value?: number
  size?: ProgressSize
  color?: ProgressColor
  label?: ReactNode
  showValue?: boolean
  className?: string
  style?: CSSProperties
}

const HEIGHT: Record<ProgressSize, number> = { xs: 4, sm: 6, md: 8, lg: 12 }
const FILL: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

/** Determinate progress track (0–100). */
export function ProgressBar({ value = 0, size = 'md', color = 'primary', label, showValue = false, className, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex flex-col gap-1.5 font-sans', className)} style={style}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs">
          {label && <span className="font-medium text-ink-muted">{label}</span>}
          {showValue && <span className="tabular-nums text-ink-subtle">{Math.round(pct)}%</span>}
        </div>
      )}
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="overflow-hidden rounded-full bg-gray-200" style={{ height: HEIGHT[size] }}>
        <div className={cn('h-full rounded-full transition-[width] duration-240 ease-ks', FILL[color])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
