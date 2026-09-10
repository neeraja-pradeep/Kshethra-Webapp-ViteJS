import type { RbacUser } from '@/features/rbac/domain/entities/rbac-user'

/** Poojari accounts carry a profile identifier; nothing else may. */
export const POOJARI_ROLE = 'temple_poojari'

export interface StaffUserFormValues {
  username: string
  password: string
  role: string
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  isActive: boolean
  employeeId: string
}

export function blankStaffUser(defaultRole: string): StaffUserFormValues {
  return {
    username: '',
    password: '',
    role: defaultRole,
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    isActive: true,
    employeeId: '',
  }
}

export function staffUserFromRecord(user: RbacUser): StaffUserFormValues {
  return {
    username: user.username,
    password: '',
    role: user.baseRole,
    email: user.email,
    phoneNumber: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    employeeId: '',
  }
}
