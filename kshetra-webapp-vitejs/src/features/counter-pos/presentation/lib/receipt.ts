import type { CounterReceipt, CounterReceiptItem } from '@/features/counter-pos/domain/entities/counter-receipt'
import { receiptDevotees } from '@/features/counter-pos/domain/entities/counter-receipt'
import type { PaymentMethod } from '@/features/counter-pos/domain/entities/payment'
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

/** "22 Jul 2026 · 11:32 am" from the receipt's server timestamp. */
function formatStamp(isoDateTime: string): string {
  const stamp = new Date(isoDateTime)
  if (Number.isNaN(stamp.getTime())) return isoDateTime
  const date = stamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = stamp.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${date} · ${time}`
}

function invoiceNumberFor(receipt: CounterReceipt): string {
  const seq = receipt.receiptNo.replace(/\D/g, '') || String(receipt.id)
  const stamp = new Date(receipt.createdAt)
  if (Number.isNaN(stamp.getTime())) return seq
  const month = stamp.toLocaleDateString('en-IN', { month: 'short' })
  return `${stamp.getFullYear()}/${month}${String(stamp.getDate()).padStart(2, '0')}/${seq}`
}

/**
 * Groups a receipt's items by god and expands each into per-person, per-date
 * rows for printing.
 *
 * Page totals come from each item's server-computed `amount`, not from
 * multiplying the rows out: `amount` already excludes cancelled occurrences,
 * so on a partly-voided receipt the two would disagree and the server is right.
 */
export function buildReceiptPages(receipt: CounterReceipt, templeName: string): readonly ReceiptPage[] {
  const byGod = new Map<string, CounterReceiptItem[]>()
  for (const item of receipt.items) {
    const god = item.god || 'Temple'
    const existing = byGod.get(god)
    if (existing) existing.push(item)
    else byGod.set(god, [item])
  }

  const fallbackPeople = receiptDevotees(receipt)
  const invoiceNo = invoiceNumberFor(receipt)
  const gods = [...byGod.keys()]

  return gods.map((god, index) => {
    const items = byGod.get(god) ?? []
    const rows: ReceiptRow[] = []
    const remarks: string[] = []

    for (const item of items) {
      const people = item.people.length > 0 ? item.people : fallbackPeople.slice(0, item.peopleCount || 1)
      if (item.remarks) remarks.push(item.remarks)
      for (const date of item.dates) {
        for (const person of people) {
          rows.push({
            sl: rows.length + 1,
            name: person.name,
            nakshatra: person.nakshatram || '—',
            pooja: item.name,
            date: formatDateFull(date),
            amount: item.base,
          })
        }
      }
    }

    return {
      god,
      rows,
      total: items.reduce((sum, item) => sum + item.amount, 0),
      remarks: remarks.join(' · '),
      pageLabel: `${index + 1} of ${gods.length}`,
      invoiceNo,
      dateTime: formatStamp(receipt.createdAt),
      // `staff_name` is the staff member's full name, falling back to their
      // email — both can be blank, and a receipt must not print an empty till.
      counter: receipt.staffName || 'Counter',
      method: receipt.paymentMethod,
      temple: templeName,
    }
  })
}
