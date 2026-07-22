import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
import type { Transaction, TransactionItem } from '@/features/counter-pos/domain/entities/transaction'
import { formatDateFull } from './date'

export interface ReceiptRow {
  readonly sl: number
  readonly name: string
  readonly nakshatra: string
  readonly pooja: string
  readonly date: string
  readonly amount: number
}

/** One printed A5 page — poojas are grouped onto separate pages by god. */
export interface ReceiptPage {
  readonly god: string
  readonly rows: readonly ReceiptRow[]
  readonly total: number
  readonly remarks: string
  readonly pageLabel: string
  readonly invoiceNo: string
  readonly dateTime: string
  readonly counter: string
  readonly method: PaymentMethod
  readonly temple: string
}

/** Groups a transaction's items by god and expands each into per-person, per-date rows. */
export function buildReceiptPages(txn: Transaction, templeName: string): readonly ReceiptPage[] {
  const byGod: Record<string, TransactionItem[]> = {}
  const godOrder: string[] = []
  txn.items.forEach((it) => {
    const god = it.god || 'Temple'
    const existing = byGod[god]
    if (existing) existing.push(it)
    else {
      byGod[god] = [it]
      godOrder.push(god)
    }
  })

  const seq = txn.rcp.replace(/\D/g, '') || '1'
  const [day, mon, year] = txn.date.split(' ')
  const invoiceNo = `${year ?? ''}/${mon ?? ''}${String(day ?? '').padStart(2, '0')}/${seq}`

  return godOrder.map((god, gi) => {
    const rows: ReceiptRow[] = []
    let total = 0
    const remarksList: string[] = []

    for (const it of byGod[god] ?? []) {
      const people = it.people && it.people.length > 0 ? it.people : txn.devotees.slice(0, it.peopleCount || 1)
      const per = it.base != null ? it.base : it.count ? Math.round(it.amount / it.count) : it.amount
      if (it.remarks) remarksList.push(it.remarks)
      for (const d of it.dates) {
        for (const p of people) {
          total += per
          rows.push({ sl: rows.length + 1, name: p.name, nakshatra: p.nakshatra || '—', pooja: it.name, date: formatDateFull(d), amount: per })
        }
      }
    }

    return {
      god,
      rows,
      total,
      remarks: remarksList.join(' · '),
      pageLabel: `${gi + 1} of ${godOrder.length}`,
      invoiceNo,
      dateTime: `${txn.date} · ${txn.time}`,
      counter: txn.staff,
      method: txn.method,
      temple: templeName,
    }
  })
}
