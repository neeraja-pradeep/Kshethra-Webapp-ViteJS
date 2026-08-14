import type { Result } from '@/core/error/result'
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

export interface PermissionFilters {
  /** Matches name, codename or model. */
  readonly search?: string
  readonly appLabel?: string
}

export interface RoleFilters {
  /** Hide the three built-ins. */
  readonly customOnly?: boolean
  readonly page?: number
  /** 10 per page by default, 100 max. */
  readonly pageSize?: number
}

export interface UserFilters {
  /** Matches username, email or phone. */
  readonly search?: string
  readonly baseRole?: string
  /** A custom role's `name`, not its id. */
  readonly role?: string
  readonly page?: number
  readonly pageSize?: number
}

/** One page of a paginated list, with the unpaginated total. */
export interface Page<T> {
  readonly count: number
  readonly results: readonly T[]
}

/**
 * Every method returns a `Result` — the caller must acknowledge the failure
 * branch to reach the data. The one apparent exception is `deleteRole`, whose
 * `409` is an expected outcome rather than a failure; see `DeleteRoleOutcome`.
 */
export interface RbacRepository {
  fetchPermissions(filters?: PermissionFilters): Promise<Result<PermissionCatalogue>>

  fetchRoles(filters?: RoleFilters): Promise<Result<Page<RbacRole>>>
  fetchRole(id: number): Promise<Result<RbacRole>>
  createRole(input: CreateRoleInput): Promise<Result<RbacRole>>
  /** `permissions`, when sent, replaces the whole set. */
  updateRole(id: number, changes: UpdateRoleInput): Promise<Result<RbacRole>>
  /** `force` re-sends past the `409` and revokes the role from every holder. */
  deleteRole(id: number, force?: boolean): Promise<Result<DeleteRoleOutcome>>

  fetchRoleUsers(id: number, page?: number): Promise<Result<Page<RbacUser>>>
  assignRoleToUsers(roleId: number, userIds: readonly number[]): Promise<Result<void>>
  unassignRoleFromUsers(roleId: number, userIds: readonly number[]): Promise<Result<void>>

  fetchUsers(filters?: UserFilters): Promise<Result<Page<RbacUser>>>
  fetchUser(id: number): Promise<Result<RbacUserDetail>>

  /** Adds, keeps existing, idempotent. */
  assignUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<RbacUserDetail>>
  removeUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<RbacUserDetail>>
  /** Replaces the whole set; `[]` clears it. Reports the delta. */
  setUserRoles(userId: number, roleIds: readonly number[]): Promise<Result<SetRolesOutcome>>

  /** The staff roles the base-role dropdown may offer. Needs `manage_users`. */
  fetchAssignableBaseRoles(): Promise<Result<readonly AssignableBaseRole[]>>
  createStaffUser(input: CreateStaffUserInput): Promise<Result<RbacUserDetail>>
  updateStaffUser(id: number, changes: UpdateStaffUserInput): Promise<Result<RbacUserDetail>>
  /** Deactivates. The row is kept so past activity stays attributable. */
  deactivateStaffUser(id: number): Promise<Result<RbacUserDetail>>
  activateStaffUser(id: number): Promise<Result<RbacUserDetail>>
  setStaffUserPassword(id: number, password: string): Promise<Result<RbacUserDetail>>
}
