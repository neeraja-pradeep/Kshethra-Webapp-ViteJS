import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: ReactNode
  labelPosition?: 'center' | 'left' | 'right'
  className?: string
  style?: CSSProperties
}

/** Hairline separator. Horizontal supports an optional centered/side label. */
export function Divider({ orientation = 'horizontal', label, labelPosition = 'center', className, style }: DividerProps) {
  if (orientation === 'vertical') {
    return <div role="separator" aria-orientation="vertical" className={cn('w-px self-stretch min-h-4 bg-stroke', className)} style={style} />
  }
  if (!label) {
    return <div role="separator" className={cn('h-px w-full bg-stroke', className)} style={style} />
  }
  const justify = labelPosition === 'left' ? 'justify-start' : labelPosition === 'right' ? 'justify-end' : 'justify-center'
  return (
    <div role="separator" className={cn('flex w-full items-center gap-3', justify, className)} style={style}>
      {labelPosition !== 'left' && <span className="h-px flex-1 bg-stroke" />}
      <span className="whitespace-nowrap text-xs font-medium text-ink-subtle">{label}</span>
      {labelPosition !== 'right' && <span className="h-px flex-1 bg-stroke" />}
    </div>
  )
}
