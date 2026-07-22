import type { OrderOccurrence } from '@/features/orders/domain/entities/order'

export type OccurrenceTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'
export type OccurrenceActionKind = 'complete' | 'reassign' | 'reassign-again' | 'cancel' | 'refund' | 'refunded'

export interface OccurrenceStatusView {
  readonly label: string
  readonly tone: OccurrenceTone
  /** No further state transitions are possible from here. */
  readonly terminal: boolean
  /** Selectable via the partial-refund checkbox. */
  readonly cancellable: boolean
  /** Row uses the danger-tinted surface (reassignment expired). */
  readonly danger: boolean
  readonly infoText: string
  readonly infoIcon: string | null
  readonly actions: readonly OccurrenceActionKind[]
}

const TONE_TEXT: Record<OccurrenceTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink-muted',
}

/** Tailwind text-color class for an occurrence's status tone. */
export function occurrenceToneTextClass(tone: OccurrenceTone): string {
  return TONE_TEXT[tone]
}

function datePassed(iso: string, todayIso: string): boolean {
  return iso < todayIso
}

/** Mirrors the prototype's `deriveOcc`: one scheduled date's current lifecycle state. */
export function deriveOccurrenceStatus(occ: OrderOccurrence, todayIso: string): OccurrenceStatusView {
  const base = (
    label: string,
    tone: OccurrenceTone,
    extra: Partial<Pick<OccurrenceStatusView, 'actions' | 'infoText' | 'infoIcon' | 'terminal' | 'danger'>> = {},
  ): OccurrenceStatusView => ({
    label,
    tone,
    terminal: false,
    cancellable: true,
    danger: false,
    infoText: '',
    infoIcon: null,
    actions: [],
    ...extra,
  })

  if (occ.recordStatus === 'Cancelled') return { ...base('Cancelled', 'neutral', { terminal: true }), cancellable: false }
  if (occ.refund === 'refunded') return { ...base('Refunded', 'neutral', { terminal: true }), cancellable: false }
  if (occ.refund === 'pending') return base('Refund pending', 'warning', { actions: ['refunded'] })
  if (occ.recordStatus === 'Completed') return { ...base('Completed', 'success', { terminal: true }), cancellable: false }

  if (occ.reassignment) {
    const expired = new Date() > new Date(occ.reassignment.deadline)
    if (expired) {
      return base('Reassignment expired', 'danger', {
        actions: ['reassign-again', 'cancel'],
        infoText: 'Reassignment expired — reassign to continue.',
        infoIcon: 'ph-fill ph-warning-circle',
        danger: true,
      })
    }
    return base('Reassigned', 'info', {
      actions: ['complete', 'reassign', 'cancel'],
      infoText: `Reassigned to ${occ.reassignment.priest} — complete within 24 hours.`,
      infoIcon: 'ph ph-clock-countdown',
    })
  }

  if (datePassed(occ.date, todayIso)) {
    return base('Awaiting completion', 'warning', {
      actions: ['complete', 'reassign', 'cancel'],
      infoText: 'Scheduled date has passed — mark complete or reassign.',
      infoIcon: 'ph-fill ph-warning-circle',
    })
  }

  return base('Scheduled', 'info', { actions: ['cancel', 'refund'] })
}

export interface OccurrenceActionMeta {
  readonly label: string
  readonly icon: string
  readonly className: string
}

const ACTION_META: Record<OccurrenceActionKind, OccurrenceActionMeta> = {
  complete: { label: 'Mark complete', icon: 'seal-check', className: 'border-primary-border bg-primary-subtle text-primary' },
  reassign: { label: 'Reassign', icon: 'arrows-clockwise', className: 'border-stroke bg-card text-ink' },
  'reassign-again': { label: 'Reassign again', icon: 'arrows-clockwise', className: 'border-primary-border bg-primary-subtle text-primary' },
  cancel: { label: 'Cancel', icon: 'prohibit', className: 'border-danger-border bg-card text-danger' },
  refund: { label: 'Mark for refund', icon: 'arrow-u-left-top', className: 'border-stroke bg-card text-ink' },
  refunded: { label: 'Mark refunded', icon: 'check-circle', className: 'border-success-border bg-card text-success' },
}

export function occurrenceActionMeta(kind: OccurrenceActionKind): OccurrenceActionMeta {
  return ACTION_META[kind]
}
