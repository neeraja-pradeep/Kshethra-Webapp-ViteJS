import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface FieldHintProps {
  editable: boolean
  children: ReactNode
  className?: string
}

/** Helper microcopy under a field — read-first detail view hides it entirely. */
export function FieldHint({ editable, children, className }: FieldHintProps) {
  if (!editable) return null
  return <span className={cn('text-2xs text-ink-subtle', className)}>{children}</span>
}
