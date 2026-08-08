import { z } from 'zod'

import type { SessionUser } from '@/features/auth/domain/entities/session-user'

/** Wire shape of `GET rbac/me/permissions/`. */
export const myPermissionsResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  base_role: z.string(),
  is_superuser: z.boolean(),
  roles: z.array(z.object({ id: z.number(), name: z.string(), label: z.string() })),
  permissions: z.array(z.string()),
})

export type MyPermissionsResponseDto = z.infer<typeof myPermissionsResponseSchema>

export function toSessionUser(dto: MyPermissionsResponseDto): SessionUser {
  return {
    id: dto.id,
    username: dto.username,
    baseRole: dto.base_role,
    isSuperuser: dto.is_superuser,
    roles: dto.roles.map((role) => ({ id: role.id, name: role.name, label: role.label })),
    permissions: dto.permissions,
  }
}
