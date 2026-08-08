import type { BookingLine, BookingPerson } from './booking'
import type { PaymentMethod } from './payment'

/**
 * Everything the counter screen collects for one walk-in sale.
 *
 * Note the absence of any amount: the server prices the sale from the
 * catalogue, so a total can never be dictated by the client.
 */
export interface CreateSaleInput {
  readonly paymentMethod: PaymentMethod
  /** The payer — need not be one of the people the poojas are for. */
  readonly customerName: string
  readonly customerPhone: string
  readonly people: readonly BookingPerson[]
  readonly lines: readonly BookingLine[]
}
