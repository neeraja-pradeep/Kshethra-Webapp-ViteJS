import { z } from 'zod'

import type {
  PoojariGodAssignment,
  PoojariGodOption,
  PoojariGods,
} from '@/features/rbac/domain/entities/poojari-god'

/**
 * Wire shapes for the shrine list.
 *
 * `GET` and `PUT` answer with the **same** envelope — the write echoes the read
 * and adds a `message` — so one schema parses both and the write no longer has
 * to be told who it was sent for.
 */

/** The category itself. Media fields are ignored: this list is text. */
const godSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const assignmentSchema = z.object({
  god: godSchema,
  /** Null when the poojari assigned it to themselves. */
  assigned_by_name: z.string().nullish(),
  assigned_at: z.string(),
})

/** `GET` and `PUT admin/poojaris/{id}/gods/` — the write adds only a `message`. */
export const poojariGodsResponseSchema = z.object({
  poojari: z.object({ id: z.number(), name: z.string() }),
  gods: z.array(assignmentSchema),
})

/** A page of `booking/poojacategory/`, for the picker. */
export const godOptionResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
})

export type PoojariGodsResponseDto = z.infer<typeof poojariGodsResponseSchema>
export type GodOptionResponseDto = z.infer<typeof godOptionResponseSchema>

function toAssignment(dto: z.infer<typeof assignmentSchema>): PoojariGodAssignment {
  return {
    god: { id: dto.god.id, name: dto.god.name },
    assignedByName: dto.assigned_by_name ?? null,
    assignedAt: dto.assigned_at,
  }
}

export function toPoojariGods(dto: PoojariGodsResponseDto): PoojariGods {
  return {
    poojariId: dto.poojari.id,
    poojariName: dto.poojari.name,
    assignments: dto.gods.map(toAssignment),
  }
}

export function toGodOption(dto: GodOptionResponseDto): PoojariGodOption {
  return { id: dto.id, name: dto.name }
}
