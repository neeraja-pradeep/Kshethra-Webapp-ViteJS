import type { CSSProperties } from 'react'

import { cn } from '@/shared/lib/cn'

export type IconWeight = 'regular' | 'fill' | 'bold' | 'thin' | 'light' | 'duotone'

export interface IconProps {
  /** Phosphor icon name in kebab-case, e.g. "calendar-blank". */
  name: string
  /** Pixel size (number) or any CSS length string. Default 20. */
  size?: number | string
  weight?: IconWeight
  color?: string
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

/**
 * Phosphor webfont glyph. The regular + fill weight stylesheets are loaded
 * once globally (see main.tsx). Weight = state: `regular` for default UI,
 * `fill` to mark an active/selected item.
 */
export function Icon({ name, size = 20, weight = 'regular', color, className, style, ...rest }: IconProps) {
  const weightClass = weight === 'regular' ? 'ph' : `ph-${weight}`
  return (
    <i
      className={cn(weightClass, `ph-${name}`, className)}
      aria-hidden={rest['aria-label'] ? undefined : true}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        lineHeight: 1,
        color,
        display: 'inline-flex',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    />
  )
}
