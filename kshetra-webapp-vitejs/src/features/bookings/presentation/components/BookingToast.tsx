import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface BookingToastProps {
  show: boolean
  message: string
}

/**
 * Confirmation for an action that has already happened server-side. Kept out
 * of the way at the bottom: the operator's attention belongs on the list they
 * just changed, not on a dialog they have to dismiss.
 */
export function BookingToast({ show, message }: BookingToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed bottom-6 left-1/2 z-menu -translate-x-1/2 transition-all duration-200',
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      {message && (
        <span className="inline-flex items-center gap-2 rounded-full bg-ink-strong px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <Icon name="check-circle" size={16} />
          {message}
        </span>
      )}
    </div>
  )
}
