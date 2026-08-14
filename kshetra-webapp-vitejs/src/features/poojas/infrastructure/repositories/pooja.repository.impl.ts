import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'

import type { Pooja, PoojaBlock, PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type { PoojaAvailability } from '@/features/poojas/domain/entities/pooja-availability'
import type {
  BulkDeleteOutcome,
  BulkStatusOutcome,
  PoojaBlockWrite,
  PoojaFilters,
  PoojaImportOutcome,
  PoojaPage,
  PoojaRepository,
  PoojaSaveOutcome,
  PoojaWrite,
} from '@/features/poojas/domain/repositories/pooja.repository'
import {
  toAvailability,
  toPooja,
  toPoojaBlock,
  toPoojasSummary,
  type PoojaResponseDto,
} from '@/features/poojas/infrastructure/data-sources/remote/pooja.response'
import {
  deletePoojaBlock,
  deletePoojaRequest,
  getAvailability,
  getPooja,
  getPoojas,
  hasImageChange,
  patchPooja,
  patchPoojaImages,
  patchPoojaStatus,
  postBulkDeletePoojas,
  postBulkPoojaStatus,
  postDuplicatePooja,
  postPooja,
  postPoojaBlock,
  postPoojaImport,
} from '@/features/poojas/infrastructure/data-sources/remote/poojas.api'

/**
 * The artwork step, run after the pooja itself is safely saved.
 *
 * A failure here is not a failed save: the pooja exists and its blocks are
 * reconciled. Reporting it as an error would invite a retry that re-runs step
 * one, so it is carried back as a sentence the drawer can show beside a saved
 * record instead.
 */
async function attachImages(
  saved: PoojaResponseDto,
  input: Partial<PoojaWrite>,
): Promise<PoojaSaveOutcome> {
  if (!hasImageChange(input)) return { pooja: toPooja(saved), imageError: null }
  try {
    return { pooja: toPooja(await patchPoojaImages(saved.id, input)), imageError: null }
  } catch (error) {
    return { pooja: toPooja(saved), imageError: mapHttpError(error).message }
  }
}

export const poojaRepository: PoojaRepository = {
  async fetchPoojas(filters: PoojaFilters = {}): Promise<Result<PoojaPage>> {
    try {
      const page = await getPoojas(filters)
      return ok({
        count: page.count,
        results: page.results.map(toPooja),
        summary: toPoojasSummary(page.summary),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchPooja(id: number): Promise<Result<Pooja>> {
    try {
      return ok(toPooja(await getPooja(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createPooja(input: PoojaWrite): Promise<Result<PoojaSaveOutcome>> {
    try {
      return ok(await attachImages(await postPooja(input), input))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updatePooja(id: number, input: Partial<PoojaWrite>): Promise<Result<PoojaSaveOutcome>> {
    try {
      return ok(await attachImages(await patchPooja(id, input), input))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deletePooja(id: number): Promise<Result<void>> {
    try {
      await deletePoojaRequest(id)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setPoojaStatus(id: number, status: PoojaStatus): Promise<Result<Pooja>> {
    try {
      return ok(toPooja(await patchPoojaStatus(id, status)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async duplicatePooja(id: number, name?: string): Promise<Result<Pooja>> {
    try {
      return ok(toPooja(await postDuplicatePooja(id, name)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async bulkSetPoojaStatus(
    ids: readonly number[],
    status: PoojaStatus,
  ): Promise<Result<BulkStatusOutcome>> {
    try {
      const dto = await postBulkPoojaStatus(ids, status)
      return ok({ message: dto.message, updatedCount: dto.updated_count, notFound: dto.not_found })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async bulkDeletePoojas(ids: readonly number[]): Promise<Result<BulkDeleteOutcome>> {
    try {
      const dto = await postBulkDeletePoojas(ids)
      return ok({
        message: dto.message,
        deletedCount: dto.deleted_count,
        skipped: dto.skipped,
        notFound: dto.not_found,
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchAvailability(
    id: number,
    start?: string,
    end?: string,
  ): Promise<Result<PoojaAvailability>> {
    try {
      return ok(toAvailability(await getAvailability(id, start, end)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async blockDates(id: number, block: PoojaBlockWrite): Promise<Result<PoojaBlock>> {
    try {
      return ok(toPoojaBlock(await postPoojaBlock(id, block)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async unblockDates(id: number, blockId: number): Promise<Result<void>> {
    try {
      await deletePoojaBlock(id, blockId)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async importPoojas(file: File): Promise<Result<PoojaImportOutcome>> {
    try {
      const dto = await postPoojaImport(file)
      return ok({
        message: dto.message,
        totalRows: dto.total_rows,
        createdCount: dto.created_count,
        failedCount: dto.failed_count,
        errors: dto.errors.map((e) => ({
          row: e.row,
          column: e.column ?? '',
          value: e.value == null ? '' : String(e.value),
          error: e.error,
        })),
      })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
