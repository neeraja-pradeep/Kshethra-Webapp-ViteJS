import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { God, GodStatus } from '@/features/poojas/domain/entities/god'
import type {
  GodFilters,
  GodPage,
  GodRepository,
  GodWrite,
} from '@/features/poojas/domain/repositories/god.repository'
import {
  toGod,
  toGodsSummary,
} from '@/features/poojas/infrastructure/data-sources/remote/god.response'
import {
  deleteGodRequest,
  getGods,
  patchGod,
  patchGodStatus,
  postGod,
  postReorderGods,
} from '@/features/poojas/infrastructure/data-sources/remote/gods.api'

export const godRepository: GodRepository = {
  async fetchGods(filters: GodFilters = {}): Promise<Result<GodPage>> {
    try {
      const page = await getGods(filters)
      return ok({
        count: page.count,
        results: page.results.map(toGod),
        summary: toGodsSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createGod(input: GodWrite): Promise<Result<God>> {
    try {
      return ok(toGod(await postGod(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateGod(id: number, input: Partial<GodWrite>): Promise<Result<God>> {
    try {
      return ok(toGod(await patchGod(id, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteGod(id: number): Promise<Result<void>> {
    try {
      await deleteGodRequest(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setGodStatus(id: number, status: GodStatus): Promise<Result<God>> {
    try {
      return ok(toGod(await patchGodStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async reorderGods(orderedIds: readonly number[]): Promise<Result<readonly God[]>> {
    try {
      // The server's own `1..N` numbering comes back on the response, so the
      // caller redraws from what was actually written rather than from the
      // order it hoped for.
      return ok((await postReorderGods(orderedIds)).map(toGod))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
