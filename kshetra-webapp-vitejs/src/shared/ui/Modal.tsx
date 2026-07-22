import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: ModalSize
  className?: string
  style?: CSSProperties
}

const WIDTH: Record<ModalSize, number> = { sm: 400, md: 520, lg: 720 }

/** Centered modal dialog. Closes on overlay click, close button, or Escape. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', className, style }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 font-sans [backdrop-filter:blur(2px)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn('flex w-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl', className)}
        style={{ maxWidth: WIDTH[size], maxHeight: 'calc(100vh - 48px)', ...style }}
      >
        <div className="flex items-start gap-3 px-5 pb-3.5 pt-4.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.75">
            {title && <h2 className="m-0 text-xl font-semibold text-ink-strong">{title}</h2>}
            {description && <p className="m-0 text-sm leading-snug text-ink-subtle">{description}</p>}
          </div>
          {onClose && (
            <button type="button" aria-label="Close" onClick={onClose} className="h-7 w-7 shrink-0 rounded-md border-none bg-transparent p-0 leading-none text-ink-subtle cursor-pointer hover:bg-hover">
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 pb-1 text-base leading-normal text-ink">{children}</div>
        {footer && <div className="mt-2 flex justify-end gap-2 px-5 pb-4.5 pt-4">{footer}</div>}
      </div>
    </div>
  )
}
