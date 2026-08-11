import { z } from 'zod'

/**
 * Wire shapes every DRF endpoint shares. Feature modules must not import each
 * other, so anything more than one feature needs lives here rather than in
 * whichever feature happened to need it first.
 */

/** Standard DRF page: `{ count, next, previous, results }`. */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  })
}
