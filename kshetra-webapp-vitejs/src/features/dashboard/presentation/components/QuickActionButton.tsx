import type { QuickAction } from '@/features/dashboard/domain/entities/quick-action'
import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

export interface QuickActionButtonProps {
  action: QuickAction
  onClick: () => void
}

/**
 * Dashboard header quick action. A bespoke 36px pill — none of the shared
 * `Button` sizes match this spec exactly, so it composes `Icon` directly
 * with DS background/hover tokens (no brightness filters).
 */
export function QuickActionButton({ action, onClick }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.75 whitespace-nowrap rounded-md px-3.5 font-sans text-sm font-medium transition-colors duration-120 ease-ks',
        action.primary
          ? 'bg-primary text-primary-contrast shadow-xs hover:bg-primary-hover'
          : 'bg-card text-ink shadow-[inset_0_0_0_0.5px_var(--border-default)] hover:bg-hover',
      )}
    >
      <Icon name={action.icon} size={16} />
      {action.label}
    </button>
  )
}
