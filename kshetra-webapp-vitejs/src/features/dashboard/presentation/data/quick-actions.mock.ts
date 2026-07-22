import type { QuickAction } from '@/features/dashboard/domain/entities/quick-action'

/** Header quick actions — copied verbatim from the DC prototype's `dashActions`. */
export const DASHBOARD_QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-counter-booking', label: 'New counter booking', icon: 'receipt', primary: true },
  { id: 'add-pooja', label: 'Add pooja', icon: 'flame', primary: false },
  { id: 'send-notification', label: 'Send notification', icon: 'paper-plane-tilt', primary: false },
]
