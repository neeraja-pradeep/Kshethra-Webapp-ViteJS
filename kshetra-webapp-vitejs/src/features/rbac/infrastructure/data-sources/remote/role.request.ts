import type { CreateRoleInput, UpdateRoleInput } from '@/features/rbac/domain/entities/rbac-role'

export interface CreateRoleRequestDto {
  readonly name: string
  readonly label: string
  readonly description?: string
  readonly permissions?: readonly string[]
  readonly is_active?: boolean
}

export interface UpdateRoleRequestDto {
  readonly label?: string
  readonly description?: string
  readonly permissions?: readonly string[]
  readonly is_active?: boolean
}

export function toCreateRoleRequest(input: CreateRoleInput): CreateRoleRequestDto {
  return {
    name: input.name,
    label: input.label,
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.permissions === undefined ? {} : { permissions: input.permissions }),
    ...(input.isActive === undefined ? {} : { is_active: input.isActive }),
  }
}

/**
 * Only the keys the caller actually set are sent. That distinction is load
 * bearing: an omitted `permissions` leaves the role's set alone, while sending
 * it replaces the set wholesale — so an accidental `undefined` must not become
 * an empty array on the wire.
 *
 * `name` is absent by design; the server ignores it and it can never change.
 */
export function toUpdateRoleRequest(changes: UpdateRoleInput): UpdateRoleRequestDto {
  return {
    ...(changes.label === undefined ? {} : { label: changes.label }),
    ...(changes.description === undefined ? {} : { description: changes.description }),
    ...(changes.permissions === undefined ? {} : { permissions: changes.permissions }),
    ...(changes.isActive === undefined ? {} : { is_active: changes.isActive }),
  }
}
