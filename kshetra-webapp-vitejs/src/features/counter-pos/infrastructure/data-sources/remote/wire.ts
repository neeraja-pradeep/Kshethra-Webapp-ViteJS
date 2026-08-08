import { z } from 'zod'

/**
 * Shared wire-shape helpers. The backend is not uniform about either money or
 * pagination, and both quirks are absorbed here rather than in every DTO.
 */

/**
 * DRF serialises `DecimalField` as a string (`"9500.00"`), but a few endpoints
 * hand back a plain number. Accept both and always hand a number upward.
 */
export const decimal = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => Number.isFinite(value), { message: 'Expected a decimal value' })

/** Standard DRF page: `{ count, next, previous, results }`. */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  })
}

/**
 * `booking/poojas/` and `booking/poojacategory/` hand back the WHOLE filtered
 * set as `{ count, results }` — no `next`/`previous`, and `page`/`page_size`
 * are ignored. Treating these as pages silently truncates the catalogue.
 */
export function countedList<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    count: z.number(),
    results: z.array(item),
  })
}
