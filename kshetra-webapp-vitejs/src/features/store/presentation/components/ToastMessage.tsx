import { Icon } from '@/shared/ui'

export interface ToastMessageProps {
  show: boolean
  message: string
}

/** Bottom-center transient confirmation, e.g. "Product saved". */
export function ToastMessage({ show, message }: ToastMessageProps) {
  if (!show) return null
  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-menu flex -translate-x-1/2 items-center gap-2.25 rounded-lg bg-ink-strong px-4 py-2.75 font-sans text-sm font-medium text-card shadow-xl"
    >
      <Icon name="check-circle" size={17} />
      {message}
    </div>
  )
}
