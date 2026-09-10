import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type {
  TempleLocation,
  TempleLocationPage,
  TempleLocationWrite,
} from '@/features/temple-locations/domain/entities/temple-location'
import type {
  TempleLocationFilters,
  TempleLocationRepository,
} from '@/features/temple-locations/domain/repositories/temple-location.repository'
import {
  deleteTempleLocation,
  getTempleLocation,
  getTempleLocations,
  patchTempleLocation,
  postTempleLocation,
} from '@/features/temple-locations/infrastructure/data-sources/remote/templeLocations.api'
import { toTempleLocation } from '@/features/temple-locations/infrastructure/data-sources/remote/templeLocation.response'

export const templeLocationRepository: TempleLocationRepository = {
  async fetchTempleLocations(
    filters: TempleLocationFilters = {},
  ): Promise<Result<TempleLocationPage>> {
    try {
      const page = await getTempleLocations(filters)
      return ok({ count: page.count, results: page.results.map(toTempleLocation) })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchTempleLocation(id: number): Promise<Result<TempleLocation>> {
    try {
      return ok(toTempleLocation(await getTempleLocation(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createTempleLocation(input: TempleLocationWrite): Promise<Result<TempleLocation>> {
    try {
      return ok(toTempleLocation(await postTempleLocation(input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateTempleLocation(
    id: number,
    input: TempleLocationWrite,
  ): Promise<Result<TempleLocation>> {
    try {
      return ok(toTempleLocation(await patchTempleLocation(id, input)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deleteTempleLocation(id: number): Promise<Result<void>> {
    try {
      await deleteTempleLocation(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
