import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { rbacKeys } from '@/features/rbac/application/queries/rbac.keys'
import { useRbacInvalidation } from '@/features/rbac/application/queries/useRbacInvalidation'
import { activateStaffUser } from '@/features/rbac/application/usecases/activateStaffUser'
import { assignRoleToUsers } from '@/features/rbac/application/usecases/assignRoleToUsers'
import { assignUserRoles } from '@/features/rbac/application/usecases/assignUserRoles'
import { createRole } from '@/features/rbac/application/usecases/createRole'
import { createStaffUser } from '@/features/rbac/application/usecases/createStaffUser'
import { deactivateStaffUser } from '@/features/rbac/application/usecases/deactivateStaffUser'
import { deleteRole } from '@/features/rbac/application/usecases/deleteRole'
import { removeUserRoles } from '@/features/rbac/application/usecases/removeUserRoles'
import { setPoojariGods } from '@/features/rbac/application/usecases/setPoojariGods'
import { setStaffUserPassword } from '@/features/rbac/application/usecases/setStaffUserPassword'
import { setUserRoles } from '@/features/rbac/application/usecases/setUserRoles'
import { unassignRoleFromUsers } from '@/features/rbac/application/usecases/unassignRoleFromUsers'
import { updateRole } from '@/features/rbac/application/usecases/updateRole'
import { updateStaffUser } from '@/features/rbac/application/usecases/updateStaffUser'
import type { CreateRoleInput, UpdateRoleInput } from '@/features/rbac/domain/entities/rbac-role'
import type { CreateStaffUserInput, UpdateStaffUserInput } from '@/features/rbac/domain/entities/rbac-user'

/**
 * Every write here refreshes the RBAC lists *and* the signed-in session — see
 * `useRbacInvalidation` for why the session half is not optional.
 */

export function useCreateRoleMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async (input: CreateRoleInput) => unwrap(await createRole(input)),
    onSuccess: invalidate,
  })
}

export function useUpdateRoleMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    /** `changes.permissions` replaces the role's whole set — send all of it. */
    mutationFn: async ({ id, changes }: { id: number; changes: UpdateRoleInput }) =>
      unwrap(await updateRole(id, changes)),
    onSuccess: invalidate,
  })
}

export function useDeleteRoleMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ id, force }: { id: number; force?: boolean }) => unwrap(await deleteRole(id, force)),
    /**
     * A `stillAssigned` outcome deleted nothing, but invalidating anyway is
     * harmless and keeps the caller from having to branch here.
     */
    onSuccess: invalidate,
  })
}

export function useAssignRoleToUsersMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ roleId, userIds }: { roleId: number; userIds: readonly number[] }) =>
      unwrap(await assignRoleToUsers(roleId, userIds)),
    onSuccess: invalidate,
  })
}

export function useUnassignRoleFromUsersMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ roleId, userIds }: { roleId: number; userIds: readonly number[] }) =>
      unwrap(await unassignRoleFromUsers(roleId, userIds)),
    onSuccess: invalidate,
  })
}

export function useAssignUserRolesMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: readonly number[] }) =>
      unwrap(await assignUserRoles(userId, roleIds)),
    onSuccess: invalidate,
  })
}

export function useRemoveUserRolesMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: readonly number[] }) =>
      unwrap(await removeUserRoles(userId, roleIds)),
    onSuccess: invalidate,
  })
}

export function useSetUserRolesMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    /** Replaces the whole set; `[]` clears it. The result carries the delta. */
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: readonly number[] }) =>
      unwrap(await setUserRoles(userId, roleIds)),
    onSuccess: invalidate,
  })
}

/**
 * Staff-account writes.
 *
 * Every one of these answers with the full user detail, so the caller gets the
 * recomputed roles and effective permissions back without a second request.
 */

export function useCreateStaffUserMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async (input: CreateStaffUserInput) => unwrap(await createStaffUser(input)),
    onSuccess: invalidate,
  })
}

export function useUpdateStaffUserMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: UpdateStaffUserInput }) =>
      unwrap(await updateStaffUser(id, changes)),
    onSuccess: invalidate,
  })
}

/** DELETE deactivates; the account is kept so past activity stays attributable. */
export function useDeactivateStaffUserMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await deactivateStaffUser(id)),
    onSuccess: invalidate,
  })
}

export function useActivateStaffUserMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async (id: number) => unwrap(await activateStaffUser(id)),
    onSuccess: invalidate,
  })
}

export function useSetStaffUserPasswordMutation() {
  const invalidate = useRbacInvalidation()
  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) =>
      unwrap(await setStaffUserPassword(id, password)),
    onSuccess: invalidate,
  })
}

/**
 * Replaces a poojari's shrine list.
 *
 * Deliberately **not** `useRbacInvalidation`: a shrine list decides which
 * bookings the poojari app shows them, not what they may do. No permission
 * moves, so refreshing the signed-in session and every role and user list would
 * be work with nothing to show for it. Only this poojari's list is stale.
 */
export function useSetPoojariGodsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      godIds,
    }: {
      userId: number
      /** The whole list — anything omitted is dropped. `[]` returns them to unscoped. */
      godIds: readonly number[]
    }) => unwrap(await setPoojariGods(userId, godIds)),
    onSuccess: (_result, { userId }) =>
      queryClient.invalidateQueries({ queryKey: rbacKeys.poojariGods(userId) }),
  })
}
