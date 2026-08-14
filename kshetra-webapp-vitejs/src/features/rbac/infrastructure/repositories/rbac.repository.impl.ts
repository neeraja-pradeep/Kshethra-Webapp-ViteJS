import { mapHttpError } from '@/core/error/mapHttpError'
import { err, ok, type Result } from '@/core/error/result'
import type { Failure } from '@/core/error/failure'

import type { PermissionCatalogue } from '@/features/rbac/domain/entities/permission'
import type {
  CreateRoleInput,
  DeleteRoleOutcome,
  RbacRole,
  UpdateRoleInput,
} from '@/features/rbac/domain/entities/rbac-role'
import type {
  AssignableBaseRole,
  CreateStaffUserInput,
  RbacUser,
  RbacUserDetail,
  SetRolesOutcome,
  UpdateStaffUserInput,
} from '@/features/rbac/domain/entities/rbac-user'
import type {
  Page,
  PermissionFilters,
  RbacRepository,
  RoleFilters,
  UserFilters,
} from '@/features/rbac/domain/repositories/rbac.repository'
import { toAssignableBaseRoles } from '@/features/rbac/infrastructure/data-sources/remote/assignableRole.response'
import { toPermissionCatalogue } from '@/features/rbac/infrastructure/data-sources/remote/permission.response'
import {
  toCreateStaffUserRequest,
  toUpdateStaffUserRequest,
} from '@/features/rbac/infrastructure/data-sources/remote/staffUser.request'
import {
  deleteRole,
  deleteStaffUser,
  getAssignableRoles,
  getPermissions,
  getRole,
  getRoles,
  getRoleUsers,
  getUser,
  getUsers,
  patchRole,
  patchStaffUser,
  postActivateUser,
  postAssignRole,
  postAssignUserRoles,
  postRemoveUserRoles,
  postRole,
  postSetUserPassword,
  postSetUserRoles,
  postStaffUser,
  postUnassignRole,
} from '@/features/rbac/infrastructure/data-sources/remote/rbac.api'
import {
  toCreateRoleRequest,
  toUpdateRoleRequest,
} from '@/features/rbac/infrastructure/data-sources/remote/role.request'
import { toRbacRole } from '@/features/rbac/infrastructure/data-sources/remote/role.response'
import {
  toRbacUser,
  toRbacUserDetail,
  toSetRolesOutcome,
} from '@/features/rbac/infrastructure/data-sources/remote/rbacUser.response'

const CONFLICT_STATUS = 409

/**
 * Reads the holder count off the `409` body. `mapHttpError` keeps every
 * non-message key in `details`, so `user_count` survives the conversion.
 */
function stillAssignedCount(failure: Failure): number | null {
  if (failure.status !== CONFLICT_STATUS) return null
  const count = failure.details?.user_count
  return typeof count === 'number' ? count : null
}

export const rbacRepository: RbacRepository = {
  async fetchPermissions(filters: PermissionFilters = {}): Promise<Result<PermissionCatalogue>> {
    try {
      return ok(toPermissionCatalogue(await getPermissions(filters)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchRoles(filters: RoleFilters = {}): Promise<Result<Page<RbacRole>>> {
    try {
      const page = await getRoles(filters)
      return ok({ count: page.count, results: page.results.map(toRbacRole) })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchRole(id: number): Promise<Result<RbacRole>> {
    try {
      return ok(toRbacRole(await getRole(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createRole(input: CreateRoleInput): Promise<Result<RbacRole>> {
    try {
      return ok(toRbacRole(await postRole(toCreateRoleRequest(input))))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateRole(id: number, changes: UpdateRoleInput): Promise<Result<RbacRole>> {
    try {
      return ok(toRbacRole(await patchRole(id, toUpdateRoleRequest(changes))))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  /**
   * The `409` is translated back into a success value. It is not a failure —
   * it is the server asking a question ("this role has 3 holders, still
   * delete?") that only the user can answer, and reporting it as an error
   * would leave the caller parsing an error body to find the follow-up.
   */
  async deleteRole(id: number, force = false): Promise<Result<DeleteRoleOutcome>> {
    try {
      return ok({ kind: 'deleted', detail: await deleteRole(id, force) })
    } catch (error) {
      const failure = mapHttpError(error)
      const userCount = stillAssignedCount(failure)
      if (userCount === null) return err(failure)
      return ok({ kind: 'stillAssigned', detail: failure.message, userCount })
    }
  },

  async fetchRoleUsers(id: number, page?: number): Promise<Result<Page<RbacUser>>> {
    try {
      const result = await getRoleUsers(id, page)
      return ok({ count: result.count, results: result.results.map(toRbacUser) })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async assignRoleToUsers(roleId: number, userIds: readonly number[]): Promise<Result<void>> {
    try {
      await postAssignRole(roleId, userIds)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async unassignRoleFromUsers(roleId: number, userIds: readonly number[]): Promise<Result<void>> {
    try {
      await postUnassignRole(roleId, userIds)
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchUsers(filters: UserFilters = {}): Promise<Result<Page<RbacUser>>> {
    try {
      const page = await getUsers(filters)
      return ok({ count: page.count, results: page.results.map(toRbacUser) })
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchUser(id: number): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await getUser(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async assignUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await postAssignUserRoles(userId, roleIds)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async removeUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await postRemoveUserRoles(userId, roleIds)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<SetRolesOutcome>> {
    try {
      return ok(toSetRolesOutcome(await postSetUserRoles(userId, roleIds)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async fetchAssignableBaseRoles(): Promise<Result<readonly AssignableBaseRole[]>> {
    try {
      return ok(toAssignableBaseRoles(await getAssignableRoles()))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async createStaffUser(input: CreateStaffUserInput): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await postStaffUser(toCreateStaffUserRequest(input))))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async updateStaffUser(id: number, changes: UpdateStaffUserInput): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await patchStaffUser(id, toUpdateStaffUserRequest(changes))))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async deactivateStaffUser(id: number): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await deleteStaffUser(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async activateStaffUser(id: number): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await postActivateUser(id)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },

  async setStaffUserPassword(id: number, password: string): Promise<Result<RbacUserDetail>> {
    try {
      return ok(toRbacUserDetail(await postSetUserPassword(id, password)))
    } catch (error) {
      return err(mapHttpError(error))
    }
  },
}
