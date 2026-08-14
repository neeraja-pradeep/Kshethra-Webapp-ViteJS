import type { CreateStaffUserInput, UpdateStaffUserInput } from '@/features/rbac/domain/entities/rbac-user'

export interface CreateStaffUserRequestDto {
  readonly username: string
  readonly password: string
  readonly role: string
  readonly email?: string
  readonly phone_number?: string
  readonly first_name?: string
  readonly last_name?: string
  readonly is_active?: boolean
  readonly employee_id?: string
}

export interface UpdateStaffUserRequestDto {
  readonly role?: string
  readonly email?: string
  readonly phone_number?: string
  readonly first_name?: string
  readonly last_name?: string
  readonly is_active?: boolean
}

export function toCreateStaffUserRequest(input: CreateStaffUserInput): CreateStaffUserRequestDto {
  return {
    username: input.username,
    password: input.password,
    role: input.role,
    ...(input.email === undefined ? {} : { email: input.email }),
    ...(input.phoneNumber === undefined ? {} : { phone_number: input.phoneNumber }),
    ...(input.firstName === undefined ? {} : { first_name: input.firstName }),
    ...(input.lastName === undefined ? {} : { last_name: input.lastName }),
    ...(input.isActive === undefined ? {} : { is_active: input.isActive }),
    // The server rejects an employee id on anything but a poojari, so an empty
    // string must not be sent as if it were a value.
    ...(input.employeeId ? { employee_id: input.employeeId } : {}),
  }
}

/**
 * Only the keys the caller actually set are sent, as `toUpdateRoleRequest`
 * does — a `PATCH` that names a field replaces it, so an accidental
 * `undefined` becoming `""` would silently clear an email or a phone number.
 */
export function toUpdateStaffUserRequest(changes: UpdateStaffUserInput): UpdateStaffUserRequestDto {
  return {
    ...(changes.role === undefined ? {} : { role: changes.role }),
    ...(changes.email === undefined ? {} : { email: changes.email }),
    ...(changes.phoneNumber === undefined ? {} : { phone_number: changes.phoneNumber }),
    ...(changes.firstName === undefined ? {} : { first_name: changes.firstName }),
    ...(changes.lastName === undefined ? {} : { last_name: changes.lastName }),
    ...(changes.isActive === undefined ? {} : { is_active: changes.isActive }),
  }
}
