/**
 * Root query keys, named in one place.
 *
 * Feature modules must not import each other, but their caches genuinely
 * overlap: a booking completed from the order detail page changes what the
 * bookings feed says, and the app runs a 60s `staleTime` with
 * `refetchOnWindowFocus` off — so the other screen will not quietly correct
 * itself. Naming the roots here is what lets one feature invalidate another's
 * cache without reaching into its module, and stops the two copies of a root
 * from drifting apart into a silent staleness bug.
 */
export const QUERY_ROOTS = {
  orders: ['orders'],
  bookings: ['bookings'],
  /**
   * Shop orders keep their own root rather than sitting under `orders`.
   * An order id is a primary key **within its table**, so pooja order 5 and
   * shop order 5 would otherwise share `['orders','detail',5]` and render each
   * other's payloads.
   */
  storeOrders: ['store-orders'],
  storeProducts: ['store-products'],
  storeCategories: ['store-categories'],
  /**
   * Poojas and gods keep separate roots even though one screen edits both.
   * A pooja write moves a god's `poojas_count`, so the two invalidate each
   * other constantly — which is only expressible if they are distinct keys.
   */
  poojas: ['poojas'],
  gods: ['gods'],
  /**
   * The counter's own cache, including the pooja and god catalogue it holds
   * for five minutes at a time. A back-office price edit has to reach the till,
   * and the whole root is invalidated rather than the catalogue sub-keys
   * because guessing those sub-keys from here is exactly the drift this file
   * exists to prevent.
   */
  counter: ['counter-pos'],
} as const
