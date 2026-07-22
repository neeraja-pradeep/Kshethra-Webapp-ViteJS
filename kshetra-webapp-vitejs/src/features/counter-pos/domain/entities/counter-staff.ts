/** A staff member who can be signed in at the counter, printed on receipts. */
export interface CounterStaff {
  readonly id: string
  readonly name: string
  readonly role: string
}
