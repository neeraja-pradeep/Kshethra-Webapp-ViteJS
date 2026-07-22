import type { CSSProperties } from 'react'

export interface SpinnerProps {
  /** Pixel size. Default 20. */
  size?: number
  thickness?: number
  color?: string
  style?: CSSProperties
  className?: string
}

/** Determinate-looking loading spinner (the only animated element in the app). */
export function Spinner({ size = 20, thickness = 2.5, color = 'var(--color-primary)', style, className }: SpinnerProps) {
  return (
    <span role="status" aria-label="Loading" className={className} style={{ display: 'inline-flex', lineHeight: 0, ...style }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'ks-spinner 0.7s linear infinite' }}>
        <circle cx={12} cy={12} r={9} fill="none" stroke="currentColor" strokeWidth={thickness} opacity={0.18} style={{ color }} />
        <circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray="56.5" strokeDashoffset="42" />
        <style>{'@keyframes ks-spinner{to{transform:rotate(360deg)}}'}</style>
      </svg>
    </span>
  )
}
