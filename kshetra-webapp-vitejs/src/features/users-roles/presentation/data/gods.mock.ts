import type { God } from '@/features/users-roles/domain/entities/god'

/** Fallback deity list used to populate the poojari "assigned gods" picker. */
export const GODS: God[] = [
  'Ganesha',
  'Shiva',
  'Vishnu',
  'Lakshmi',
  'Durga',
  'Surya',
  'Kartikeya',
  'Hanuman',
  'Saraswati',
  'Venkateswara',
  'Rama',
  'Krishna',
  'Subramanya',
  'Parvati',
  'Ayyappa',
].map((name) => ({ id: name.toLowerCase(), name }))
