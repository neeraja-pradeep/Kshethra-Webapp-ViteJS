import type { Role } from '@/features/users-roles/domain/entities/role'

/** Fixed role catalog — copied verbatim from the design prototype's ROLES seed. */
export const ROLES: Role[] = [
  {
    id: 'admin',
    label: 'Admin',
    kind: 'admin',
    web: true,
    modules: ['Dashboard', 'Counter Bookings', 'Pooja Bookings', 'Store', 'Pooja Management', 'App', 'Agent code', 'Reports', 'Users & Roles'],
    desc: 'Full access to every module, including user management.',
  },
  {
    id: 'manager',
    label: 'Manager',
    kind: 'manager',
    web: true,
    modules: ['Dashboard', 'Counter Bookings', 'Pooja Bookings', 'Store', 'Pooja Management', 'App', 'Agent code', 'Reports'],
    desc: 'Operational access across all modules except user management.',
  },
  {
    id: 'app-manager',
    label: 'App Manager',
    kind: 'manager',
    web: true,
    modules: ['App'],
    desc: 'Devotee app only — devotees, notifications, and media.',
  },
  {
    id: 'reports-manager',
    label: 'Reports Manager',
    kind: 'manager',
    web: true,
    modules: ['Reports'],
    desc: 'Financial reconciliation and reports only.',
  },
  {
    id: 'counter-staff',
    label: 'Counter Staff',
    kind: 'counter',
    web: true,
    modules: ['Counter Bookings'],
    desc: 'Counter bookings only.',
  },
  {
    id: 'store-staff',
    label: 'Store Staff',
    kind: 'store',
    web: true,
    modules: ['Store'],
    desc: 'Store orders and inventory only.',
  },
  {
    id: 'poojari',
    label: 'Poojari',
    kind: 'poojari',
    web: false,
    modules: [],
    desc: 'Priest app only — no admin web access.',
  },
]
