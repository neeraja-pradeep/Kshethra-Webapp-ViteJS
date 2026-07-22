import type { ReactNode } from 'react'

interface FieldLabelProps {
  editable: boolean
  children: ReactNode
}

/** Field name: normal weight while editing, small uppercase overline caption while viewing. */
export function FieldLabel({ editable, children }: FieldLabelProps) {
  return (
    <div className={editable ? 'text-sm font-medium text-ink' : 'text-2xs font-semibold uppercase tracking-overline text-ink-subtle'}>
      {children}
    </div>
  )
}
