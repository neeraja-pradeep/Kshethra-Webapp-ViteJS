import type { RoleFilters, UserFilters } from '@/features/rbac/domain/repositories/rbac.repository'

/** The only place RBAC query keys are constructed. */
export const rbacKeys = {
  all: ['rbac'] as const,

  permissions: () => [...rbacKeys.all, 'permissions'] as const,
  permissionCatalogue: (search?: string, appLabel?: string) =>
    [...rbacKeys.permissions(), { search: search ?? '', appLabel: appLabel ?? '' }] as const,

  roles: () => [...rbacKeys.all, 'roles'] as const,
  roleList: (filters: RoleFilters) => [...rbacKeys.roles(), 'list', filters] as const,
  role: (id: number) => [...rbacKeys.roles(), 'detail', id] as const,
  roleUsers: (id: number, page?: number) => [...rbacKeys.role(id), 'users', page ?? 1] as const,

  users: () => [...rbacKeys.all, 'users'] as const,
  userList: (filters: UserFilters) => [...rbacKeys.users(), 'list', filters] as const,
  user: (id: number) => [...rbacKeys.users(), 'detail', id] as const,
}
