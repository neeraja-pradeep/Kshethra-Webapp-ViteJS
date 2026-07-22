import type { Category } from '@/features/store/domain/entities/category'

/** Seed categories — copied verbatim from the design prototype. */
export const CATEGORIES: Category[] = [
  { id: 'cat-inc', name: 'Incense & Dhoop', sortOrder: 1, status: 'Active' },
  { id: 'cat-lmp', name: 'Lamps & Diyas', sortOrder: 2, status: 'Active' },
  { id: 'cat-kit', name: 'Puja Kits', sortOrder: 3, status: 'Active' },
  { id: 'cat-idl', name: 'Idols & Statues', sortOrder: 4, status: 'Active' },
  { id: 'cat-bok', name: 'Books & Media', sortOrder: 5, status: 'Active' },
  { id: 'cat-prd', name: 'Prasadam', sortOrder: 6, status: 'Active' },
  { id: 'cat-rud', name: 'Rudraksha & Malas', sortOrder: 7, status: 'Inactive' },
]
