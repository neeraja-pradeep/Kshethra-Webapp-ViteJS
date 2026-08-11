import { z } from 'zod'

import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'

/**
 * Wire shape of a role. `description` stays optional even though the live
 * payload sends it: the contract only promises it on the create body.
 */
export const roleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  label: z.string(),
  description: z.string().nullish(),
  is_system: z.boolean(),
  is_editable: z.boolean(),
  is_active: z.boolean(),
  permissions: z.array(z.string()),
  permission_count: z.number(),
  user_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by_username: z.string().nullish(),
})

export type RoleResponseDto = z.infer<typeof roleResponseSchema>

export function toRbacRole(dto: RoleResponseDto): RbacRole {
  return {
    id: dto.id,
    name: dto.name,
    label: dto.label,
    description: dto.description ?? '',
    isSystem: dto.is_system,
    isEditable: dto.is_editable,
    isActive: dto.is_active,
    permissions: dto.permissions,
    permissionCount: dto.permission_count,
    userCount: dto.user_count,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdByUsername: dto.created_by_username ?? null,
  }
}

/** `DELETE roles/{id}/` — `200 { detail }`, or `409 { detail, user_count }`. */
export const deleteRoleResponseSchema = z.object({
  detail: z.string(),
})

/** The `409` body. Read off the error response, not a success one. */
export const roleStillAssignedSchema = z.object({
  detail: z.string(),
  user_count: z.number(),
})
