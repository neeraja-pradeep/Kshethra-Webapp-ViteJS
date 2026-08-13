/**
 * Moving stock, and the record of having moved it.
 *
 * Stock used to change as a bare field write, so a count that was wrong on
 * Tuesday could not be explained on Wednesday. Every change now records who
 * made it, the count before and after, and why — which is what makes `reason`
 * required rather than polite.
 */

/**
 * The API takes **either** a new count **or** a movement, never both:
 * "there are 40 on the shelf" and "12 arrived" are different statements, and
 * guessing which was meant is how a stock take goes wrong. Modelling it as a
 * union makes the ambiguous request unrepresentable rather than merely refused.
 */
export type StockChange =
  | { readonly kind: 'set'; readonly quantity: number }
  | { readonly kind: 'delta'; readonly delta: number }

export interface StockAdjustmentInput {
  readonly change: StockChange
  /** Required, and the whole point of the feature. */
  readonly reason: string
}

/** One line of the history, newest first. */
export interface StockAdjustmentEntry {
  readonly id: number
  /** Signed: positive for stock arriving, negative for stock leaving. */
  readonly delta: number
  readonly quantityBefore: number
  readonly quantityAfter: number
  readonly reason: string
  /** Display name of whoever made the change — recorded by the server. */
  readonly adjustedBy: string
  readonly createdAt: string
}

/** What the change would leave on the shelf, for the modal's preview. */
export function resultingQuantity(current: number, change: StockChange): number {
  return change.kind === 'set' ? change.quantity : current + change.delta
}

/**
 * The refusals worth catching before the round trip, in the server's own order.
 * Returns null when the adjustment is worth sending.
 */
export function validateStockAdjustment(current: number, input: StockAdjustmentInput): string | null {
  if (!input.reason.trim()) return 'A reason is required.'

  const next = resultingQuantity(current, input.change)
  if (Number.isNaN(next)) return 'Enter a number.'
  if (next === current) return 'An adjustment that changes nothing is not recorded.'
  if (next < 0) return `That would leave ${next} on the shelf. There are ${current}.`
  return null
}
