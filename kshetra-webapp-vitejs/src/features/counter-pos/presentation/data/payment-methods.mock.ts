import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'

/** The counter's accepted payment methods, in display order. */
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['Cash', 'Card', 'UPI', 'Net banking']
