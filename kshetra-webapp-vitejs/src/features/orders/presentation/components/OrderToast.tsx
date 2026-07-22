import { Icon } from '@/shared/ui'

export interface OrderToastProps {
  message: string | null
}

/** Bottom-center confirmation pill, shown briefly after a mutation completes. */
export function OrderToast({ message }: OrderToastProps) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed bottom-6.5 left-1/2 z-menu flex -translate-x-1/2 items-center gap-2.25 whitespace-nowrap rounded-full bg-gray-900 px-4 py-2.5 font-sans text-sm font-medium text-white shadow-lg"
    >
      <Icon name="check-circle" weight="fill" size={16} className="text-success" />
      {message}
    </div>
  )
}
