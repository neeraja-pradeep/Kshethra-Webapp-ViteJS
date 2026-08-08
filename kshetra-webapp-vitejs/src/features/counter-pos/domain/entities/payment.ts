/**
 * How a devotee settled a counter sale. These are the server's wire values —
 * the display strings live in `PAYMENT_METHOD_LABELS` so the two never drift.
 */
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking'

/** Tender order the KPI band and the method tiles both render in. */
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['cash', 'card', 'upi', 'netbanking']

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Net banking',
}

export function paymentMethodLabel(method: PaymentMethod | null): string {
  return method ? PAYMENT_METHOD_LABELS[method] : '—'
}
