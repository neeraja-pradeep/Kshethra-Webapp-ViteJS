import { http } from '@/core/api/http'
import { paginated } from '@/core/api/wire'
import { RBAC_ENDPOINTS } from '@/core/config/endpoints'

import {
  permissionCatalogueResponseSchema,
  type PermissionCatalogueResponseDto,
} from '@/features/rbac/infrastructure/data-sources/remote/permission.response'
import {
  assignableRolesResponseSchema,
  type AssignableRolesResponseDto,
} from '@/features/rbac/infrastructure/data-sources/remote/assignableRole.response'
import type {
  CreateRoleRequestDto,
  UpdateRoleRequestDto,
} from '@/features/rbac/infrastructure/data-sources/remote/role.request'
import type {
  CreateStaffUserRequestDto,
  UpdateStaffUserRequestDto,
} from '@/features/rbac/infrastructure/data-sources/remote/staffUser.request'
import {
  deleteRoleResponseSchema,
  roleResponseSchema,
  type RoleResponseDto,
} from '@/features/rbac/infrastructure/data-sources/remote/role.response'
import {
  rbacUserDetailResponseSchema,
  rbacUserResponseSchema,
  setRolesResponseSchema,
  type RbacUserDetailResponseDto,
  type RbacUserResponseDto,
  type SetRolesResponseDto,
} from '@/features/rbac/infrastructure/data-sources/remote/rbacUser.response'

/** One page of a DRF list, carrying the unpaginated total. */
export interface PageDto<T> {
  readonly count: number
  readonly results: readonly T[]
}

export interface PermissionQuery {
  readonly search?: string
  readonly appLabel?: string
}

export async function getPermissions(query: PermissionQuery = {}): Promise<PermissionCatalogueResponseDto> {
  const response = await http.get(RBAC_ENDPOINTS.permissions, {
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.appLabel ? { app_label: query.appLabel } : {}),
    },
  })
  return permissionCatalogueResponseSchema.parse(response.data)
}

export interface RoleQuery {
  readonly customOnly?: boolean
  readonly page?: number
  readonly pageSize?: number
}

export async function getRoles(query: RoleQuery = {}): Promise<PageDto<RoleResponseDto>> {
  const response = await http.get(RBAC_ENDPOINTS.roles, {
    params: {
      ...(query.customOnly ? { custom_only: 'true' } : {}),
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { page_size: query.pageSize } : {}),
    },
  })
  const page = paginated(roleResponseSchema).parse(response.data)
  return { count: page.count, results: page.results }
}

export async function getRole(id: number): Promise<RoleResponseDto> {
  const response = await http.get(RBAC_ENDPOINTS.role(id))
  return roleResponseSchema.parse(response.data)
}

export async function postRole(body: CreateRoleRequestDto): Promise<RoleResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.roles, body)
  return roleResponseSchema.parse(response.data)
}

export async function patchRole(id: number, body: UpdateRoleRequestDto): Promise<RoleResponseDto> {
  const response = await http.patch(RBAC_ENDPOINTS.role(id), body)
  return roleResponseSchema.parse(response.data)
}

/**
 * A `409` here is not an error the caller should report — it means the role
 * still has holders and the request must be re-sent with `force`. It arrives as
 * a rejection, so the repository is what turns it back into an outcome.
 */
export async function deleteRole(id: number, force = false): Promise<string> {
  const response = await http.delete(RBAC_ENDPOINTS.role(id), {
    params: force ? { force: 'true' } : {},
  })
  return deleteRoleResponseSchema.parse(response.data).detail
}

export async function getRoleUsers(id: number, page?: number): Promise<PageDto<RbacUserResponseDto>> {
  const response = await http.get(RBAC_ENDPOINTS.roleUsers(id), {
    params: page ? { page } : {},
  })
  const result = paginated(rbacUserResponseSchema).parse(response.data)
  return { count: result.count, results: result.results }
}

export async function postAssignRole(roleId: number, userIds: readonly number[]): Promise<void> {
  await http.post(RBAC_ENDPOINTS.assignRole(roleId), { user_ids: userIds })
}

export async function postUnassignRole(roleId: number, userIds: readonly number[]): Promise<void> {
  await http.post(RBAC_ENDPOINTS.unassignRole(roleId), { user_ids: userIds })
}

export interface UserQuery {
  readonly search?: string
  readonly baseRole?: string
  readonly role?: string
  readonly page?: number
  readonly pageSize?: number
}

export async function getUsers(query: UserQuery = {}): Promise<PageDto<RbacUserResponseDto>> {
  const response = await http.get(RBAC_ENDPOINTS.users, {
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.baseRole ? { base_role: query.baseRole } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.page ? { page: query.page } : {}),
      ...(query.pageSize ? { page_size: query.pageSize } : {}),
    },
  })
  const page = paginated(rbacUserResponseSchema).parse(response.data)
  return { count: page.count, results: page.results }
}

export async function getUser(id: number): Promise<RbacUserDetailResponseDto> {
  const response = await http.get(RBAC_ENDPOINTS.user(id))
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function postAssignUserRoles(userId: number, roleIds: readonly number[]): Promise<RbacUserDetailResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.assignUserRoles(userId), { role_ids: roleIds })
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function postRemoveUserRoles(userId: number, roleIds: readonly number[]): Promise<RbacUserDetailResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.removeUserRoles(userId), { role_ids: roleIds })
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function postSetUserRoles(userId: number, roleIds: readonly number[]): Promise<SetRolesResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.setUserRoles(userId), { role_ids: roleIds })
  return setRolesResponseSchema.parse(response.data)
}

export async function getAssignableRoles(): Promise<AssignableRolesResponseDto> {
  const response = await http.get(RBAC_ENDPOINTS.assignableRoles)
  return assignableRolesResponseSchema.parse(response.data)
}

/**
 * The five staff-account writes.
 *
 * All of them answer with the full user detail, including the recomputed
 * `effective_permissions`, so callers can seed the detail cache from the
 * response instead of refetching.
 */
export async function postStaffUser(body: CreateStaffUserRequestDto): Promise<RbacUserDetailResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.users, body)
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function patchStaffUser(id: number, body: UpdateStaffUserRequestDto): Promise<RbacUserDetailResponseDto> {
  const response = await http.patch(RBAC_ENDPOINTS.user(id), body)
  return rbacUserDetailResponseSchema.parse(response.data)
}

/** DELETE deactivates and keeps the row, so it answers with the user, not 204. */
export async function deleteStaffUser(id: number): Promise<RbacUserDetailResponseDto> {
  const response = await http.delete(RBAC_ENDPOINTS.user(id))
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function postActivateUser(id: number): Promise<RbacUserDetailResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.activateUser(id))
  return rbacUserDetailResponseSchema.parse(response.data)
}

export async function postSetUserPassword(id: number, password: string): Promise<RbacUserDetailResponseDto> {
  const response = await http.post(RBAC_ENDPOINTS.setUserPassword(id), { password })
  return rbacUserDetailResponseSchema.parse(response.data)
}
