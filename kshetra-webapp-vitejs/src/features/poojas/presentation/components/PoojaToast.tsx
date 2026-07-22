import { Icon } from '@/shared/ui'

export interface PoojaToastProps {
  show: boolean
  message: string
}

/** Bottom-center confirmation toast for save/deactivate/delete/import actions. */
export function PoojaToast({ show, message }: PoojaToastProps) {
  if (!show) return null

  return (
    <div role="status" className="fixed bottom-7 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2.25 rounded-lg bg-ink-strong px-4 py-2.75 text-sm font-medium text-card shadow-xl">
      <Icon name="check-circle" weight="fill" size={17} />
      {message}
    </div>
  )
}
