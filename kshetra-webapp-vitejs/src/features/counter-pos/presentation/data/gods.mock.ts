import type { God } from '@/features/counter-pos/domain/entities/god'

/** Default god catalogue (copied verbatim from the DC prototype's DEFAULT_GODS seed). */
export const GODS: readonly God[] = [
  { id: 'ganesha', name: 'Ganesha', status: 'Active', sortOrder: 1 },
  { id: 'shiva', name: 'Shiva', status: 'Active', sortOrder: 2 },
  { id: 'vishnu', name: 'Vishnu', status: 'Active', sortOrder: 3 },
  { id: 'lakshmi', name: 'Lakshmi', status: 'Active', sortOrder: 4 },
  { id: 'durga', name: 'Durga', status: 'Active', sortOrder: 5 },
  { id: 'surya', name: 'Surya', status: 'Active', sortOrder: 6 },
  { id: 'kartikeya', name: 'Kartikeya', status: 'Active', sortOrder: 7 },
  { id: 'hanuman', name: 'Hanuman', status: 'Active', sortOrder: 8 },
]
