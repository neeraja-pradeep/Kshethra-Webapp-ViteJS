import type { Transaction } from '@/features/counter-pos/domain/entities/transaction'

/**
 * Today's seeded counter sales (copied from the DC prototype's seedTransactions()),
 * resolved against a fixed "today" so the fixture stays deterministic.
 */
export const SEED_TRANSACTIONS: readonly Transaction[] = [
  {
    rcp: 'RCP-1041',
    time: '11:32 am',
    date: '22 Jul 2026',
    devotees: [
      { name: 'Lakshmi Narayan Iyer', nakshatra: 'Ashwini' },
      { name: 'Arjun Iyer', nakshatra: 'Rohini' },
    ],
    items: [
      { name: 'Sankashti Chaturthi Pooja', god: 'Ganesha', dates: ['2026-07-22'], peopleCount: 2, count: 2, amount: 1502 },
      { name: 'Satyanarayana Pooja', god: 'Vishnu', dates: ['2026-07-22', '2026-07-29'], peopleCount: 2, count: 4, amount: 10000 },
    ],
    total: 11502,
    method: 'UPI',
    staff: 'Ravi Kumar',
    poojaCount: 6,
  },
  {
    rcp: 'RCP-1040',
    time: '10:48 am',
    date: '22 Jul 2026',
    devotees: [{ name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }],
    items: [{ name: 'Ganapathi Homa', god: 'Ganesha', dates: ['2026-07-22'], peopleCount: 1, count: 1, amount: 2100 }],
    total: 2100,
    method: 'Cash',
    staff: 'Ravi Kumar',
    poojaCount: 1,
  },
  {
    rcp: 'RCP-1039',
    time: '09:21 am',
    date: '22 Jul 2026',
    devotees: [
      { name: 'Meera Krishnan', nakshatra: 'Hasta' },
      { name: 'Suresh Nair', nakshatra: 'Pushya' },
      { name: 'Anjali Menon', nakshatra: 'Chitra' },
    ],
    items: [
      { name: 'Lakshmi Kubera Pooja', god: 'Lakshmi', dates: ['2026-07-22'], peopleCount: 3, count: 3, amount: 9600 },
      { name: 'Maha Rudrabhishekam', god: 'Shiva', dates: ['2026-07-22'], peopleCount: 3, count: 3, amount: 14400 },
    ],
    total: 24000,
    method: 'Card',
    staff: 'Ravi Kumar',
    poojaCount: 6,
  },
]

/** Receipt numbers assigned start after the last seeded receipt. */
export const SEED_NEXT_RECEIPT_NO = 1042
