import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface AlertProps {
  type?: AlertType
  title?: ReactNode
  children?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  onClose?: () => void
  className?: string
  style?: CSSProperties
}

const TYPE: Record<AlertType, { wrap: string; accentBg: string; accentText: string }> = {
  info: { wrap: 'bg-info-surface shadow-[inset_0_0_0_1px_var(--color-info-border)]', accentBg: 'bg-info', accentText: 'text-info' },
  success: { wrap: 'bg-success-surface shadow-[inset_0_0_0_1px_var(--color-success-border)]', accentBg: 'bg-success', accentText: 'text-success' },
  warning: { wrap: 'bg-warning-surface shadow-[inset_0_0_0_1px_var(--color-warning-border)]', accentBg: 'bg-warning', accentText: 'text-warning' },
  danger: { wrap: 'bg-danger-surface shadow-[inset_0_0_0_1px_var(--color-danger-border)]', accentBg: 'bg-danger', accentText: 'text-danger' },
  neutral: { wrap: 'bg-gray-50 shadow-[inset_0_0_0_1px_var(--border-default)]', accentBg: 'bg-ink-muted', accentText: 'text-ink-muted' },
}
const GLYPH: Record<AlertType, string> = { info: 'i', success: '✓', warning: '!', danger: '!', neutral: 'i' }

/** Inline banner — info / success / warning / danger / neutral. */
export function Alert({ type = 'info', title, children, icon, actions, onClose, className, style }: AlertProps) {
  const t = TYPE[type]
  return (
    <div role="alert" className={cn('box-border flex gap-2.5 rounded-xl p-3 pl-3.5 font-sans', t.wrap, className)} style={style}>
      <span
        className={cn(
          'mt-px inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none',
          icon ? cn('bg-transparent', t.accentText) : cn(t.accentBg, 'text-white'),
        )}
      >
        {icon || GLYPH[type]}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <span className="text-base font-semibold text-ink-strong">{title}</span>}
        {children && <span className="text-sm leading-snug text-ink-muted">{children}</span>}
        {actions && <div className="mt-2 flex gap-2">{actions}</div>}
      </div>
      {onClose && (
        <button type="button" aria-label="Dismiss" onClick={onClose} className="h-5.5 w-5.5 shrink-0 rounded-sm border-none bg-transparent p-0 leading-none text-ink-subtle cursor-pointer">
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
