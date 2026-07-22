import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'

/**
 * Mobile-app, agent-code bookings payable (or already paid) at the counter.
 * The DC prototype reads this list from a `agentBookings` prop with no
 * fallback (empty by default) — this fixture seeds a working demo set so the
 * "Counter payments" flow has rows to find, select, and settle.
 */
export const AGENT_BOOKINGS: readonly AgentBooking[] = [
  {
    orderRef: 'AGT-2041',
    devotee: 'Priya Varma',
    phone: '+91 98450 11223',
    code: 'RK-7F3K2',
    poojaSummary: 'Satyanarayana Pooja + 1 more',
    poojaCount: 2,
    date: '20 Jul 2026',
    amount: 3801,
    method: null,
    paid: false,
  },
  {
    orderRef: 'AGT-2040',
    devotee: 'Karthik Subramaniam',
    phone: '+91 90080 44110',
    code: 'RK-9B8L4',
    poojaSummary: 'Ganapathi Homa',
    poojaCount: 1,
    date: '21 Jul 2026',
    amount: 2100,
    method: 'UPI',
    paid: true,
  },
  {
    orderRef: 'AGT-2039',
    devotee: 'Deepa Nambiar',
    phone: '+91 94470 22981',
    code: 'RK-4C1Q9',
    poojaSummary: 'Durga Saptashati Parayanam',
    poojaCount: 1,
    date: '21 Jul 2026',
    amount: 2800,
    method: null,
    paid: false,
  },
  {
    orderRef: 'AGT-2038',
    devotee: 'Mohan Das',
    phone: '+91 99460 55217',
    code: 'RK-2A6T7',
    poojaSummary: 'Maha Rudrabhishekam + 2 more',
    poojaCount: 3,
    date: '19 Jul 2026',
    amount: 6702,
    method: 'Cash',
    paid: true,
  },
  {
    orderRef: 'AGT-2037',
    devotee: 'Anitha Raghavan',
    phone: '+91 89430 76542',
    code: 'RK-8D5M1',
    poojaSummary: 'Sri Suktam Archana',
    poojaCount: 1,
    date: '22 Jul 2026',
    amount: 351,
    method: null,
    paid: false,
  },
  {
    orderRef: 'AGT-2036',
    devotee: 'Vishnu Prasad',
    phone: '+91 97460 30198',
    code: 'RK-6H2W3',
    poojaSummary: 'Vishnu Sahasranama Archana',
    poojaCount: 1,
    date: '18 Jul 2026',
    amount: 501,
    method: 'Net banking',
    paid: true,
  },
]
