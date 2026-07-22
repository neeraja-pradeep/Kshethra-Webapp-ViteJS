import type { CSSProperties } from 'react'

import { cn } from '@/shared/lib/cn'

import { Avatar, type AvatarProps, type AvatarSize } from './Avatar'

export interface AvatarGroupProps {
  items?: AvatarProps[]
  max?: number
  size?: AvatarSize
  circular?: boolean
  className?: string
  style?: CSSProperties
}

const BOX: Record<AvatarSize, number> = { xs: 20, sm: 24, md: 32, lg: 40, xl: 48, '2xl': 64, '3xl': 80 }
const FONT: Record<AvatarSize, number> = { xs: 9, sm: 10, md: 12, lg: 14, xl: 16, '2xl': 20, '3xl': 24 }

/** Overlapping avatar stack with a +N overflow chip. */
export function AvatarGroup({ items = [], max = 4, size = 'md', circular = true, className, style }: AvatarGroupProps) {
  const box = BOX[size] ?? 32
  const overlap = Math.round(box * 0.3)
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  const ring: CSSProperties = { boxShadow: '0 0 0 2px var(--surface-card)' }
  return (
    <div className={cn('inline-flex items-center', className)} style={style}>
      {shown.map((it, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -overlap, borderRadius: circular ? '50%' : 8, position: 'relative', zIndex: i, ...ring }}>
          <Avatar {...it} size={size} circular={circular} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center font-sans font-semibold text-ink-muted"
          style={{
            marginLeft: -overlap,
            width: box,
            height: box,
            borderRadius: circular ? '50%' : 8,
            background: 'var(--light-gray-200)',
            fontSize: FONT[size] ?? 12,
            position: 'relative',
            zIndex: shown.length,
            ...ring,
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
