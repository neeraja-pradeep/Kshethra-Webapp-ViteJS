import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { Devotee, DevoteeDetail, DevoteeStatus } from '@/features/devotees/domain/entities/devotee'
import type {
  DevoteeFilters,
  DevoteePage,
  DevoteeRepository,
} from '@/features/devotees/domain/repositories/devotee.repository'
import {
  toDevotee,
  toDevoteeDetail,
  toDevoteeSummary,
} from '@/features/devotees/infrastructure/data-sources/remote/devotee.response'
import {
  getDevotee,
  getDevotees,
  patchDevoteeStatus,
} from '@/features/devotees/infrastructure/data-sources/remote/devotees.api'

export const devoteeRepository: DevoteeRepository = {
  async fetchDevotees(filters: DevoteeFilters = {}): Promise<Result<DevoteePage>> {
    try {
      const page = await getDevotees(filters)
      return ok({
        count: page.count,
        results: page.results.map(toDevotee),
        summary: toDevoteeSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchDevotee(id: number): Promise<Result<DevoteeDetail>> {
    try {
      return ok(toDevoteeDetail(await getDevotee(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setDevoteeStatus(id: number, status: DevoteeStatus): Promise<Result<Devotee>> {
    try {
      return ok(toDevotee(await patchDevoteeStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
