import { Icon } from '@/shared/ui'

interface NotificationToastProps {
  show: boolean
  message: string
}

/** Bottom-center confirmation toast, auto-dismissed by the caller. */
export function NotificationToast({ show, message }: NotificationToastProps) {
  if (!show) return null
  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-[140] flex -translate-x-1/2 items-center gap-2.25 whitespace-nowrap rounded-lg bg-ink-strong px-4 py-2.75 text-sm font-medium text-card shadow-xl"
    >
      <Icon name="check-circle" size={17} />
      {message}
    </div>
  )
}
