import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline'

export interface AvatarProps {
  src?: string
  name?: string
  icon?: ReactNode
  size?: AvatarSize
  circular?: boolean
  status?: AvatarStatus
  className?: string
  style?: CSSProperties
}

const SIZES: Record<AvatarSize, { box: number; font: number; status: number; radius: number }> = {
  xs: { box: 20, font: 9, status: 6, radius: 5 },
  sm: { box: 24, font: 10, status: 7, radius: 6 },
  md: { box: 32, font: 13, status: 8, radius: 7 },
  lg: { box: 40, font: 15, status: 10, radius: 9 },
  xl: { box: 48, font: 18, status: 12, radius: 10 },
  '2xl': { box: 64, font: 24, status: 14, radius: 14 },
  '3xl': { box: 80, font: 30, status: 16, radius: 16 },
}

const STATUS_COLOR: Record<AvatarStatus, string> = {
  online: 'var(--color-success)',
  busy: 'var(--color-danger)',
  away: 'var(--color-warning)',
  offline: 'var(--light-gray-500)',
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase() || '?'
}

/** User/entity avatar with image, initials or icon fallback + optional status. */
export function Avatar({ src, name, icon, size = 'md', circular = true, status, className, style }: AvatarProps) {
  const s = SIZES[size]
  const radius = circular ? '50%' : `${s.radius}px`
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: s.box, height: s.box, ...style }}>
      <span
        className="flex items-center justify-center overflow-hidden font-sans font-semibold leading-none"
        style={{
          width: s.box,
          height: s.box,
          borderRadius: radius,
          background: src ? 'var(--light-gray-200)' : 'var(--color-primary-subtle)',
          color: 'var(--color-primary-subtle-text)',
          fontSize: s.font,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
          boxSizing: 'border-box',
        }}
      >
        {src ? <img src={src} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : icon ? icon : initials(name)}
      </span>
      {status && (
        <span
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: s.status,
            height: s.status,
            borderRadius: '50%',
            background: STATUS_COLOR[status] ?? STATUS_COLOR.offline,
            boxShadow: '0 0 0 2px var(--surface-card)',
          }}
        />
      )}
    </span>
  )
}
