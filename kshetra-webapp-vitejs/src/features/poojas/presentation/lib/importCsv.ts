import type { PoojaStatus } from '../../domain/entities/pooja'
import type { God } from '../../domain/entities/god'

export interface ImportRow {
  id: string
  row: number
  valid: boolean
  errors: string[]
  godId: string
  godName: string
  name: string
  offlinePrice: number
  onlinePrice: number
  status: PoojaStatus
  sortOrder: number
  special: boolean
}

/** Parse a "God,Pooja Name,Offline Price,Online Price,Status,Sort Order,Special" CSV into preview rows, validating against the live gods catalogue. */
export function parseImportCsv(text: string, gods: readonly God[]): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length)
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = (n: string) => header.indexOf(n)
  const col = {
    god: idx('god'),
    name: idx('pooja name') >= 0 ? idx('pooja name') : idx('name'),
    off: idx('offline price'),
    on: idx('online price'),
    status: idx('status'),
    sort: idx('sort order'),
    special: idx('special'),
  }

  return lines.slice(1).map((line, i) => {
    const cells = line.split(',').map((c) => c.trim())
    const get = (k: keyof typeof col) => (col[k] >= 0 ? cells[col[k]] || '' : '')
    const godRaw = get('god')
    const name = get('name')
    const off = get('off')
    const on = get('on')
    const statusRaw = get('status')
    const sort = get('sort')
    const special = get('special')

    const errors: string[] = []
    const god = gods.find((g) => g.name.toLowerCase() === godRaw.toLowerCase() || g.id === godRaw.toLowerCase())
    if (!godRaw) errors.push('God is required')
    else if (!god) errors.push(`Unknown god "${godRaw}"`)
    else if (god.status !== 'Active') errors.push(`God "${god.name}" is inactive`)
    if (!name) errors.push('Pooja name is required')
    if (off && Number.isNaN(Number(off))) errors.push('Offline price must be a number')
    if (on && Number.isNaN(Number(on))) errors.push('Online price must be a number')
    const st = statusRaw.toLowerCase()
    const statusNorm: PoojaStatus | null = st === 'inactive' ? 'Inactive' : st === 'active' || st === '' ? 'Active' : null
    if (statusNorm === null) errors.push('Status must be Active or Inactive')
    if (sort && Number.isNaN(Number(sort))) errors.push('Sort order must be a number')
    const sp = special.toLowerCase()

    return {
      id: `imp-${i}`,
      row: i + 2,
      valid: errors.length === 0,
      errors,
      godId: god ? god.id : '',
      godName: god ? god.name : godRaw || '—',
      name,
      offlinePrice: Number(off) || 0,
      onlinePrice: Number(on) || 0,
      status: statusNorm || 'Active',
      sortOrder: Number(sort) || 0,
      special: sp === 'yes' || sp === 'true' || sp === '1',
    }
  })
}
