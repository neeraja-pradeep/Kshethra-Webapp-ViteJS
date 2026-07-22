import { Icon } from '@/shared/ui'

export interface DevoteeToastProps {
  show: boolean
  message: string
}

/** Bottom-center confirmation toast for save/suspend/reactivate/delete actions. */
export function DevoteeToast({ show, message }: DevoteeToastProps) {
  if (!show) return null

  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2.25 rounded-lg bg-ink-strong px-4 py-2.75 text-sm font-medium text-card shadow-xl"
    >
      <Icon name="check-circle" size={17} />
      {message}
    </div>
  )
}
