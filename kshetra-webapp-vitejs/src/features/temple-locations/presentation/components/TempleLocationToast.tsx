import { Icon } from '@/shared/ui'

/** Fixed-position confirmation, matching the other feature toasts. */
export function TempleLocationToast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl bg-ink-strong px-3.5 py-2.5 text-sm font-medium text-white shadow-card-hover">
        <Icon name="check-circle" weight="fill" size={16} />
        {message}
      </div>
    </div>
  )
}
