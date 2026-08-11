import { z } from 'zod'

import type { AssignedRole, RbacUser, RbacUserDetail, SetRolesOutcome } from '@/features/rbac/domain/entities/rbac-user'

const assignedRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  label: z.string(),
  is_active: z.boolean(),
  is_system: z.boolean(),
})

/** Wire shape of a row from `GET rbac/users/`. */
export const rbacUserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  phone_number: z.string().nullish(),
  base_role: z.string(),
  assigned_roles: z.array(assignedRoleSchema),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  created_at: z.string(),
})

/** `GET rbac/users/{id}/` — the row plus the flattened resolved set. */
export const rbacUserDetailResponseSchema = rbacUserResponseSchema.extend({
  effective_permissions: z.array(z.string()),
})

/** `POST users/{id}/set_roles/` — the detail shape plus what changed. */
export const setRolesResponseSchema = rbacUserDetailResponseSchema.extend({
  added: z.array(z.string()),
  removed: z.array(z.string()),
})

export type RbacUserResponseDto = z.infer<typeof rbacUserResponseSchema>
export type RbacUserDetailResponseDto = z.infer<typeof rbacUserDetailResponseSchema>
export type SetRolesResponseDto = z.infer<typeof setRolesResponseSchema>

function toAssignedRole(dto: z.infer<typeof assignedRoleSchema>): AssignedRole {
  return { id: dto.id, name: dto.name, label: dto.label, isActive: dto.is_active, isSystem: dto.is_system }
}

export function toRbacUser(dto: RbacUserResponseDto): RbacUser {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    phone: dto.phone_number ?? '',
    baseRole: dto.base_role,
    assignedRoles: dto.assigned_roles.map(toAssignedRole),
    isActive: dto.is_active,
    isSuperuser: dto.is_superuser,
    createdAt: dto.created_at,
  }
}

export function toRbacUserDetail(dto: RbacUserDetailResponseDto): RbacUserDetail {
  return { ...toRbacUser(dto), effectivePermissions: dto.effective_permissions }
}

export function toSetRolesOutcome(dto: SetRolesResponseDto): SetRolesOutcome {
  return { user: toRbacUserDetail(dto), added: dto.added, removed: dto.removed }
}
