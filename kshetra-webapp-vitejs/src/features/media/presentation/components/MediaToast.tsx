import { Icon } from '@/shared/ui'

interface MediaToastProps {
  show: boolean
  message: string
}

/** Bottom-centered transient success toast (save / activate / delete, etc.). */
export function MediaToast({ show, message }: MediaToastProps) {
  if (!show) return null
  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-[140] flex -translate-x-1/2 items-center gap-2.25 rounded-lg bg-ink-strong px-4 py-2.75 text-sm font-medium text-card shadow-xl"
    >
      <Icon name="check-circle" size={17} />
      {message}
    </div>
  )
}
