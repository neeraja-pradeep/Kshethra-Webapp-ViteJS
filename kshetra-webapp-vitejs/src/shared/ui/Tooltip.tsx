import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: ReactNode
  placement?: TooltipPlacement
  children: ReactNode
  className?: string
  style?: CSSProperties
}

const POS: Record<TooltipPlacement, CSSProperties> = {
  top: { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
  bottom: { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
  left: { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
  right: { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
}

/** Wraps a single trigger; shows a dark bubble on hover/focus. */
export function Tooltip({ content, placement = 'top', children, className, style }: TooltipProps) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          className="pointer-events-none absolute z-menu whitespace-nowrap rounded-md bg-gray-900 px-2 py-1.25 text-xs font-medium leading-tight text-white shadow-md"
          style={{ ...POS[placement], ...style }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
