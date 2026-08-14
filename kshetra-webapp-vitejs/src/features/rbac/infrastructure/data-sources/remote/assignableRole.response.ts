import { z } from 'zod'

import type { AssignableBaseRole } from '@/features/rbac/domain/entities/rbac-user'

/** `users/assignable-roles/` returns a bare array, not a DRF page. */
export const assignableRolesResponseSchema = z.array(
  z.object({
    name: z.string(),
    label: z.string(),
    description: z.string().nullish(),
  }),
)

export type AssignableRolesResponseDto = z.infer<typeof assignableRolesResponseSchema>

export function toAssignableBaseRoles(dto: AssignableRolesResponseDto): readonly AssignableBaseRole[] {
  return dto.map((role) => ({
    name: role.name,
    label: role.label,
    description: role.description ?? '',
  }))
}
