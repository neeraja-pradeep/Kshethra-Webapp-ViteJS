import { svgThumb } from '@/shared/lib/format'

import type { God } from '../../domain/entities/god'

// Mirrors the design's buildGods(): 30 gods, a handful with uploaded artwork,
// three inactive — realistic for a live catalogue.
const NAMES = [
  'Ganesha', 'Shiva', 'Vishnu', 'Lakshmi', 'Durga', 'Surya', 'Dakshinamurthy', 'Kartikeya',
  'Hanuman', 'Saraswati', 'Venkateswara', 'Rama', 'Krishna', 'Narasimha', 'Ayyappa', 'Subramanya',
  'Parvati', 'Kali', 'Annapurna', 'Brahma', 'Hayagriva', 'Shani', 'Navagraha', 'Ganga',
  'Nataraja', 'Bhairava', 'Chamundeshwari', 'Garuda', 'Varahi', 'Dhanvantari',
]
const C = ['#8C001A', '#A8761A', '#1F6F8C', '#1F6F5C', '#5E6AD2', '#9A3B6E']
const WITH_IMG: Record<string, [number, number | null]> = {
  ganesha: [0, 1], vishnu: [2, 0], lakshmi: [1, 0], kartikeya: [4, 0],
  krishna: [2, 3], venkateswara: [0, 0], saraswati: [2, 0], hanuman: [3, 0],
}
const HAS_POOJA_IMG: Record<string, boolean> = { ganesha: true, lakshmi: true, krishna: true }
const INACTIVE: Record<string, boolean> = { dakshinamurthy: true, hayagriva: true, varahi: true }

export const GODS: God[] = NAMES.map((name, i) => {
  const id = name.toLowerCase()
  const wi = WITH_IMG[id]
  const init = name.slice(0, 2)
  return {
    id,
    name,
    status: INACTIVE[id] ? 'Inactive' : 'Active',
    sortOrder: i + 1,
    homeImage: wi ? svgThumb(init, C[wi[0]]) : null,
    poojaImage: wi && HAS_POOJA_IMG[id] && wi[1] != null ? svgThumb(init, C[wi[1]]) : null,
  }
})

export const GOD_NAME_BY_ID: Record<string, string> = Object.fromEntries(GODS.map((g) => [g.id, g.name]))
