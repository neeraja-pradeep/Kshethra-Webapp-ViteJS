import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type BadgeColor = 'gray' | 'red' | 'maroon' | 'green' | 'blue' | 'amber'
export type BadgeVariant = 'subtle' | 'solid' | 'outline' | 'ghost'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  children?: ReactNode
  color?: BadgeColor
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  icon?: ReactNode
  className?: string
  style?: CSSProperties
}

const SIZE: Record<BadgeSize, string> = {
  sm: 'h-4.5 px-1.5 text-2xs gap-1',
  md: 'h-5 px-2 text-xs gap-1',
  lg: 'h-6 px-2.5 text-sm gap-1.25',
}
const DOT: Record<BadgeSize, string> = { sm: 'w-1.5 h-1.5', md: 'w-1.5 h-1.5', lg: 'w-1.75 h-1.75' }

// per color: [subtle bg, strong text, outline/ghost text, border, solid bg]
const COLOR: Record<BadgeColor, { subtle: string; solid: string; strongText: string; border: string; dot: string }> = {
  gray: { subtle: 'bg-gray-100 text-ink-muted', solid: 'bg-gray-700 text-white', strongText: 'text-ink-muted', border: 'border-stroke', dot: 'bg-gray-700' },
  red: { subtle: 'bg-danger-surface text-danger-strong', solid: 'bg-danger text-white', strongText: 'text-danger-strong', border: 'border-danger-border', dot: 'bg-danger' },
  maroon: { subtle: 'bg-primary-subtle text-primary-subtle-text', solid: 'bg-primary text-white', strongText: 'text-primary-subtle-text', border: 'border-primary-border', dot: 'bg-primary' },
  green: { subtle: 'bg-success-surface text-success-strong', solid: 'bg-success text-white', strongText: 'text-success-strong', border: 'border-success-border', dot: 'bg-success' },
  blue: { subtle: 'bg-info-surface text-info-strong', solid: 'bg-info text-white', strongText: 'text-info-strong', border: 'border-info-border', dot: 'bg-info' },
  amber: { subtle: 'bg-warning-surface text-warning-strong', solid: 'bg-warning text-white', strongText: 'text-warning-strong', border: 'border-warning-border', dot: 'bg-warning' },
}

/** Small status pill. */
export function Badge({ children, color = 'gray', variant = 'subtle', size = 'md', dot = false, icon, className, style }: BadgeProps) {
  const c = COLOR[color]
  const variantClass =
    variant === 'solid'
      ? cn(c.solid, 'border-transparent')
      : variant === 'outline'
        ? cn('bg-transparent', c.strongText, c.border)
        : variant === 'ghost'
          ? cn('bg-transparent', c.strongText, 'border-transparent')
          : cn(c.subtle, 'border-transparent')

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-medium leading-none tracking-wide whitespace-nowrap box-border',
        SIZE[size],
        variantClass,
        className,
      )}
      style={style}
    >
      {dot && <span className={cn('shrink-0 rounded-full', DOT[size], variant === 'solid' ? 'bg-white' : c.dot)} />}
      {icon}
      {children}
    </span>
  )
}
