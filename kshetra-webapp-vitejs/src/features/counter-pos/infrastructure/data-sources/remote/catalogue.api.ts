import { http } from '@/core/api/http'
import { CATALOGUE_ENDPOINTS } from '@/core/config/endpoints'

import { godResponseSchema, type GodResponseDto } from '@/features/counter-pos/infrastructure/data-sources/remote/god.response'
import {
  nakshatramResponseSchema,
  type NakshatramResponseDto,
} from '@/features/counter-pos/infrastructure/data-sources/remote/nakshatram.response'
import { poojaResponseSchema, type PoojaResponseDto } from '@/features/counter-pos/infrastructure/data-sources/remote/pooja.response'
import { countedList, paginated } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

/**
 * `user/nakshatrams/` is paged at 10 by the project default and there are 27
 * nakshatras — without this the dropdown silently shows a third of them.
 */
const NAKSHATRAM_PAGE_SIZE = 100

/**
 * The whole pooja catalogue. Deliberately unfiltered by god or search: the
 * endpoint ignores `page`/`page_size` and returns everything anyway, and the
 * server caches the response, so one fetch beats a request per keystroke.
 */
/**
 * The catalogue, optionally narrowed by the server.
 *
 * `search` matches more than a client-side filter over `name` can: it reaches
 * the pooja's god as well, and it matches a romanized spelling of a Malayalam
 * name — "haridra homam" finds ഹരിദ്ര ഹോമം, which no `includes()` over the
 * loaded rows would ever match.
 *
 * `godId` is the browse chip. Applied here rather than over the loaded rows
 * because those rows are already narrowed by `search` — filtering them again
 * would silently search within the search instead of the catalogue.
 *
 * Sent as `god`, the endpoint's documented alias for `category`: identical
 * behaviour, and it says what the chip means rather than what the table is
 * called. There is also a `gods=1,2,3` OR-list, unused because the browse row
 * is single-select — one god at a time, or none.
 */
export async function getPoojas(search?: string, godId?: number): Promise<readonly PoojaResponseDto[]> {
  const response = await http.get(CATALOGUE_ENDPOINTS.poojas, {
    params: {
      ...(search ? { search } : {}),
      ...(godId != null ? { god: godId } : {}),
    },
  })
  return countedList(poojaResponseSchema).parse(response.data).results
}

export async function getGods(): Promise<readonly GodResponseDto[]> {
  const response = await http.get(CATALOGUE_ENDPOINTS.poojaCategories, { params: { is_active: 'true' } })
  return countedList(godResponseSchema).parse(response.data).results
}

export async function getNakshatrams(): Promise<readonly NakshatramResponseDto[]> {
  const response = await http.get(CATALOGUE_ENDPOINTS.nakshatrams, { params: { page_size: NAKSHATRAM_PAGE_SIZE } })
  return paginated(nakshatramResponseSchema).parse(response.data).results
}
