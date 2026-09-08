import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { God } from '@/features/counter-pos/domain/entities/god'
import type { Nakshatra } from '@/features/counter-pos/domain/entities/nakshatra'
import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'
import type { CatalogueRepository } from '@/features/counter-pos/domain/repositories/catalogue.repository'
import { getGods, getNakshatrams, getPoojas } from '@/features/counter-pos/infrastructure/data-sources/remote/catalogue.api'
import { toGod } from '@/features/counter-pos/infrastructure/data-sources/remote/god.response'
import { toNakshatra } from '@/features/counter-pos/infrastructure/data-sources/remote/nakshatram.response'
import { toPooja } from '@/features/counter-pos/infrastructure/data-sources/remote/pooja.response'

export const catalogueRepository: CatalogueRepository = {
  async fetchPoojas(search?: string, godId?: number): Promise<Result<readonly Pooja[]>> {
    try {
      // There is no server-side "active only" filter on this endpoint, so the
      // inactive ones are dropped here — booking one would fail the whole sale.
      // This still applies to a searched list: the server matches on name and
      // god, not on whether the till may sell the row.
      const poojas = (await getPoojas(search, godId)).map(toPooja).filter((pooja) => pooja.status === 'Active')
      return ok(poojas)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchGods(): Promise<Result<readonly God[]>> {
    try {
      const gods = (await getGods()).map(toGod).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      return ok(gods)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchNakshatrams(): Promise<Result<readonly Nakshatra[]>> {
    try {
      return ok((await getNakshatrams()).map(toNakshatra))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
