import { useQuery } from '@tanstack/react-query'

import { unwrap } from '@/core/error/result'

import { rbacKeys } from '@/features/rbac/application/queries/rbac.keys'
import { fetchPermissions } from '@/features/rbac/application/usecases/fetchPermissions'
import { fetchRole } from '@/features/rbac/application/usecases/fetchRole'
import { fetchRoles } from '@/features/rbac/application/usecases/fetchRoles'
import { fetchRoleUsers } from '@/features/rbac/application/usecases/fetchRoleUsers'
import { fetchUser } from '@/features/rbac/application/usecases/fetchUser'
import { fetchUsers } from '@/features/rbac/application/usecases/fetchUsers'
import type { RoleFilters, UserFilters } from '@/features/rbac/domain/repositories/rbac.repository'

/**
 * The permission catalogue is a deployment-time fact — it only changes when the
 * backend ships new permissions — so it is worth holding for the session rather
 * than refetching each time the role builder opens.
 */
const CATALOGUE_STALE_TIME_MS = 30 * 60 * 1000

export function usePermissionCatalogueQuery(search?: string, appLabel?: string) {
  return useQuery({
    queryKey: rbacKeys.permissionCatalogue(search, appLabel),
    queryFn: async () => unwrap(await fetchPermissions({ search, appLabel })),
    staleTime: CATALOGUE_STALE_TIME_MS,
  })
}

export function useRolesQuery(filters: RoleFilters = {}) {
  return useQuery({
    queryKey: rbacKeys.roleList(filters),
    queryFn: async () => unwrap(await fetchRoles(filters)),
  })
}

export function useRoleQuery(id: number | null) {
  return useQuery({
    queryKey: rbacKeys.role(id ?? 0),
    queryFn: async () => unwrap(await fetchRole(id ?? 0)),
    enabled: id !== null,
  })
}

export function useRoleUsersQuery(id: number | null, page?: number) {
  return useQuery({
    queryKey: rbacKeys.roleUsers(id ?? 0, page),
    queryFn: async () => unwrap(await fetchRoleUsers(id ?? 0, page)),
    enabled: id !== null,
  })
}

export function useRbacUsersQuery(filters: UserFilters = {}) {
  return useQuery({
    queryKey: rbacKeys.userList(filters),
    queryFn: async () => unwrap(await fetchUsers(filters)),
  })
}

export function useRbacUserQuery(id: number | null) {
  return useQuery({
    queryKey: rbacKeys.user(id ?? 0),
    queryFn: async () => unwrap(await fetchUser(id ?? 0)),
    enabled: id !== null,
  })
}
