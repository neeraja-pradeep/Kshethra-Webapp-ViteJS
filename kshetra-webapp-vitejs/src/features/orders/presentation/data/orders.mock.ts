import type {
  Order,
  OrderChannel,
  OrderOccurrence,
  OrderPaymentStatus,
  OrderPerson,
  OrderReassignment,
  OrderRecordStatus,
  OccurrenceRefundState,
} from '@/features/orders/domain/entities/order'
import { formatOrderDate } from '@/features/orders/presentation/lib/format'

/**
 * Pooja Orders mock data — reconstructed from the Kshetra Admin Shell
 * prototype's booking seed (`buildBookings`), grouped by `orderRef` into
 * orders the way `poojaOrders()` does. Names, poojas, prices, agent codes,
 * dates and statuses are copied verbatim; ~14 additional orders extend the
 * set to a fuller, still-deterministic list for pagination/filtering.
 */

type GodId = 'ganesha' | 'shiva' | 'vishnu' | 'lakshmi' | 'durga' | 'surya'

const GOD_NAME: Record<GodId, string> = {
  ganesha: 'Ganesha',
  shiva: 'Shiva',
  vishnu: 'Vishnu',
  lakshmi: 'Lakshmi',
  durga: 'Durga',
  surya: 'Surya',
}

const PRIEST_BY_GOD: Record<GodId, string> = {
  ganesha: 'Sharma Sastrigal',
  shiva: 'Venkatesh Bhattar',
  vishnu: 'Krishnan Namboothiri',
  lakshmi: 'Gopal Iyer',
  durga: 'Anand Sharma',
  surya: 'Ramesh Dikshit',
}

const PRICE_MAP: Record<string, number> = {
  'Ganapathi Homa': 2100,
  'Satyanarayana Pooja': 751,
  'Maha Rudrabhishekam': 4800,
  'Lakshmi Kubera Pooja': 3200,
  'Aditya Hridaya Parayanam': 1500,
  'Durga Saptashati Parayanam': 1100,
  'Sri Suktam Archana': 251,
  'Maha Mrityunjaya Homa': 5500,
}

interface SeedOccurrence {
  readonly date: string
  readonly recordStatus?: OrderRecordStatus
  readonly refund?: OccurrenceRefundState
  readonly reassignment?: OrderReassignment | null
}

interface SeedLineItem {
  readonly poojaName: string
  readonly godId: GodId
  readonly people: readonly OrderPerson[]
  readonly dates: readonly SeedOccurrence[]
}

interface SeedOrder {
  readonly ref: string
  readonly devoteeName: string
  readonly lineItems: readonly SeedLineItem[]
  readonly paymentStatus: OrderPaymentStatus
  readonly channel?: OrderChannel
  readonly counterStaff?: string
  readonly counterPaidMethod?: string
  readonly agentCode?: string
  readonly phone?: string
}

function refIndex(ref: string): number {
  const match = ref.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function derivePhone(ref: string): string {
  const idx = refIndex(ref)
  return `+91 98${800 + (idx % 199)} ${10000 + (idx % 89999)}`
}

function deriveEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/(^\.|\.$)/g, '')
  return `${slug}@example.in`
}

const ONLINE_METHODS = ['UPI', 'Card', 'Net banking']

function buildOrder(seed: SeedOrder): Order {
  const idx = refIndex(seed.ref)
  const channel: OrderChannel = seed.channel ?? 'Mobile app'
  const payAtCounter = channel === 'Counter' || !!seed.agentCode
  const paymentMethod = payAtCounter
    ? seed.paymentStatus === 'Paid'
      ? `Counter — ${seed.counterPaidMethod ?? 'paid'}`
      : 'Payable at counter'
    : ONLINE_METHODS[idx % ONLINE_METHODS.length]

  const lineItems = seed.lineItems.map((li) => ({
    poojaName: li.poojaName,
    godName: GOD_NAME[li.godId],
    basePrice: PRICE_MAP[li.poojaName] ?? 1500,
    people: li.people,
    occurrences: li.dates.map(
      (occ, i): OrderOccurrence => ({
        id: `${seed.ref}-${li.poojaName}-${i}`,
        date: occ.date,
        poojari: PRIEST_BY_GOD[li.godId],
        recordStatus: occ.recordStatus ?? 'Pending',
        refund: occ.refund ?? 'none',
        reassignment: occ.reassignment ?? null,
      }),
    ),
  }))

  const firstDate = lineItems[0]?.occurrences[0]?.date ?? '2026-07-01'

  return {
    id: seed.ref,
    ref: seed.ref,
    devoteeName: seed.devoteeName,
    phone: seed.phone ?? derivePhone(seed.ref),
    email: deriveEmail(seed.devoteeName),
    channel,
    counterStaff: seed.counterStaff ?? null,
    counterPaidMethod: seed.counterPaidMethod ?? null,
    agentCode: seed.agentCode ?? null,
    paymentMethod,
    paymentStatus: seed.paymentStatus,
    bookedAt: `${formatOrderDate(addDaysISO(firstDate, -3))}, 8:15 am`,
    receiptRef: `RCP-${seed.ref.replace('KP-', '')}`,
    lineItems,
    refundLog: [],
  }
}

// ---- Seed orders (verbatim from the prototype's booking seed) --------------

const SEED_ORDERS: readonly SeedOrder[] = [
  {
    ref: 'KP-2041',
    devoteeName: 'Lakshmi Narayan Iyer',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [
          { name: 'Lakshmi Narayan Iyer', nakshatra: 'Ashwini' },
          { name: 'Arjun Iyer', nakshatra: 'Rohini' },
        ],
        dates: [{ date: '2026-07-01' }, { date: '2026-07-08' }],
      },
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [{ name: 'Arjun Iyer', nakshatra: 'Rohini' }],
        dates: [{ date: '2026-07-01', reassignment: { priest: 'Krishnan Namboothiri', deadline: '2020-01-01T00:00:00.000Z' } }],
      },
    ],
  },
  {
    ref: 'KP-2042',
    devoteeName: 'Ramesh Pillai',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Ravi Kumar',
    counterPaidMethod: 'Cash',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }],
        dates: [{ date: '2026-07-01', recordStatus: 'Completed' }],
      },
    ],
  },
  {
    ref: 'KP-2043',
    devoteeName: 'Meera Krishnan',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [
          { name: 'Meera Krishnan', nakshatra: 'Hasta' },
          { name: 'Suresh Nair', nakshatra: 'Pushya' },
          { name: 'Anjali Menon', nakshatra: 'Chitra' },
        ],
        dates: [{ date: '2026-07-01' }],
      },
    ],
  },
  {
    ref: 'KP-2044',
    devoteeName: 'Mohan Das',
    paymentStatus: 'Refunded',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [{ name: 'Mohan Das', nakshatra: 'Swati' }],
        dates: [{ date: '2026-07-01', recordStatus: 'Cancelled' }],
      },
    ],
  },
  {
    ref: 'KP-2045',
    devoteeName: 'Gita Sharma',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Durga Saptashati Parayanam',
        godId: 'durga',
        people: [{ name: 'Gita Sharma', nakshatra: 'Magha' }],
        dates: [{ date: '2026-07-01', recordStatus: 'Completed' }],
      },
    ],
  },
  {
    ref: 'KP-2046',
    devoteeName: 'Priya Desai',
    paymentStatus: 'Partially Refunded',
    lineItems: [
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [
          { name: 'Priya Desai', nakshatra: 'Revati' },
          { name: 'Vivek Rao', nakshatra: 'Anuradha' },
        ],
        dates: [{ date: '2026-07-01' }, { date: '2026-07-15', recordStatus: 'Cancelled' }],
      },
    ],
  },
  {
    ref: 'KP-2047',
    devoteeName: 'Suresh Nair',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Deepa Nair',
    counterPaidMethod: 'UPI',
    lineItems: [
      {
        poojaName: 'Maha Mrityunjaya Homa',
        godId: 'shiva',
        people: [{ name: 'Suresh Nair', nakshatra: 'Jyeshtha' }],
        dates: [{ date: '2026-07-02' }],
      },
    ],
  },
  {
    ref: 'KP-2048',
    devoteeName: 'Kavya Reddy',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [
          { name: 'Kavya Reddy', nakshatra: 'Uttara Phalguni' },
          { name: 'Mohan Das', nakshatra: 'Swati' },
        ],
        dates: [{ date: '2026-07-02' }, { date: '2026-07-09' }, { date: '2026-07-16' }],
      },
    ],
  },
  {
    ref: 'KP-2049',
    devoteeName: 'Anjali Menon',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Anjali Menon', nakshatra: 'Chitra' }],
        dates: [{ date: '2026-07-03' }],
      },
    ],
  },
  {
    ref: 'KP-2050',
    devoteeName: 'Vivek Rao',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Vivek Rao', nakshatra: 'Anuradha' }],
        dates: [{ date: '2026-07-03' }],
      },
    ],
  },
  {
    ref: 'KP-2051',
    devoteeName: 'Sita Raman',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [
          { name: 'Sita Raman', nakshatra: 'Shravana' },
          { name: 'Ramesh Pillai', nakshatra: 'Mrigashira' },
        ],
        dates: [{ date: '2026-07-05' }],
      },
    ],
  },
  {
    ref: 'KP-2052',
    devoteeName: 'Gita Sharma',
    paymentStatus: 'Refunded',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Gita Sharma', nakshatra: 'Magha' }],
        dates: [{ date: '2026-07-05', recordStatus: 'Cancelled' }],
      },
    ],
  },
  {
    ref: 'KP-3101',
    devoteeName: 'Rohan Nair',
    paymentStatus: 'Pending',
    agentCode: 'TEMPLE50',
    phone: '+91 98470 30011',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Rohan Nair', nakshatra: 'Ashwini' }],
        dates: [{ date: '2026-07-04' }],
      },
    ],
  },
  {
    ref: 'KP-3102',
    devoteeName: 'Divya Menon',
    paymentStatus: 'Pending',
    agentCode: 'SEVA',
    phone: '+91 90480 41122',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [
          { name: 'Divya Menon', nakshatra: 'Rohini' },
          { name: 'Suresh Menon', nakshatra: 'Pushya' },
        ],
        dates: [{ date: '2026-07-05' }],
      },
    ],
  },
  {
    ref: 'KP-3103',
    devoteeName: 'Arun Kumar',
    paymentStatus: 'Pending',
    agentCode: 'FESTIVE',
    phone: '+91 99620 55220',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Arun Kumar', nakshatra: 'Hasta' }],
        dates: [{ date: '2026-07-06' }],
      },
    ],
  },
  {
    ref: 'KP-3104',
    devoteeName: 'Latha Rao',
    paymentStatus: 'Paid',
    agentCode: 'TEMPLE50',
    counterPaidMethod: 'Cash',
    phone: '+91 98950 60033',
    lineItems: [
      {
        poojaName: 'Durga Saptashati Parayanam',
        godId: 'durga',
        people: [{ name: 'Latha Rao', nakshatra: 'Magha' }],
        dates: [{ date: '2026-07-02' }],
      },
    ],
  },
  {
    ref: 'KP-3105',
    devoteeName: 'Prakash Iyer',
    paymentStatus: 'Pending',
    agentCode: 'GURUKRIPA',
    phone: '+91 90370 77440',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Prakash Iyer', nakshatra: 'Mrigashira' }],
        dates: [{ date: '2026-07-08' }],
      },
    ],
  },
  {
    ref: 'KP-3106',
    devoteeName: 'Meena Pillai',
    paymentStatus: 'Pending',
    agentCode: 'SEVA',
    phone: '+91 98470 88551',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [{ name: 'Meena Pillai', nakshatra: 'Revati' }],
        dates: [{ date: '2026-07-05' }, { date: '2026-07-12' }],
      },
    ],
  },
  {
    ref: 'KP-2053',
    devoteeName: 'Meera Krishnan',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [{ name: 'Meera Krishnan', nakshatra: 'Hasta' }],
        dates: [{ date: '2026-07-08' }],
      },
    ],
  },
  {
    ref: 'KP-2054',
    devoteeName: 'Harish Menon',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Ravi Kumar',
    counterPaidMethod: 'Cash',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Harish Menon', nakshatra: 'Bharani' }],
        dates: [{ date: '2026-07-15' }],
      },
    ],
  },
  {
    ref: 'KP-2055',
    devoteeName: 'Rekha Warrier',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [
          { name: 'Rekha Warrier', nakshatra: 'Punarvasu' },
          { name: 'Sanjay Warrier', nakshatra: 'Ardra' },
        ],
        dates: [{ date: '2026-07-15' }],
      },
    ],
  },
  {
    ref: 'KP-3107',
    devoteeName: 'Nithya Balan',
    paymentStatus: 'Pending',
    agentCode: 'SEVA',
    phone: '+91 98460 22110',
    lineItems: [
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [{ name: 'Nithya Balan', nakshatra: 'Chitra' }],
        dates: [{ date: '2026-07-15' }],
      },
    ],
  },
  {
    ref: 'KP-2056',
    devoteeName: 'Devraj Kurup',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Devraj Kurup', nakshatra: 'Thiruvathira' }],
        dates: [{ date: '2026-07-16' }],
      },
    ],
  },
  {
    ref: 'KP-3108',
    devoteeName: 'Shalini Nair',
    paymentStatus: 'Pending',
    agentCode: 'TEMPLE50',
    phone: '+91 90720 33445',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [{ name: 'Shalini Nair', nakshatra: 'Makam' }],
        dates: [{ date: '2026-07-16' }],
      },
    ],
  },
  {
    ref: 'KP-2057',
    devoteeName: 'Vinod Kaimal',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [
          { name: 'Vinod Kaimal', nakshatra: 'Pooram' },
          { name: 'Asha Kaimal', nakshatra: 'Uthram' },
        ],
        dates: [{ date: '2026-07-17' }],
      },
    ],
  },
  {
    ref: 'KP-3109',
    devoteeName: 'Kiran Namboodiri',
    paymentStatus: 'Pending',
    agentCode: 'GURUKRIPA',
    phone: '+91 94470 55667',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Kiran Namboodiri', nakshatra: 'Atham' }],
        dates: [{ date: '2026-07-17' }],
      },
    ],
  },
  {
    ref: 'KP-2058',
    devoteeName: 'Lakshmi Ammal',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [{ name: 'Lakshmi Ammal', nakshatra: 'Rohini' }],
        dates: [{ date: '2026-07-18' }],
      },
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [{ name: 'Lakshmi Ammal', nakshatra: 'Rohini' }],
        dates: [{ date: '2026-07-18' }],
      },
    ],
  },
  {
    ref: 'KP-3110',
    devoteeName: 'Rajan Pillai',
    paymentStatus: 'Pending',
    agentCode: 'FESTIVE',
    phone: '+91 98950 77889',
    lineItems: [
      {
        poojaName: 'Maha Mrityunjaya Homa',
        godId: 'shiva',
        people: [{ name: 'Rajan Pillai', nakshatra: 'Anizham' }],
        dates: [{ date: '2026-07-18' }],
      },
    ],
  },
  {
    ref: 'KP-2059',
    devoteeName: 'Geetha Kumari',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [{ name: 'Geetha Kumari', nakshatra: 'Karthika' }],
        dates: [{ date: '2026-07-18' }],
      },
    ],
  },
  {
    ref: 'KP-2060',
    devoteeName: 'Manoj Varma',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Durga Saptashati Parayanam',
        godId: 'durga',
        people: [{ name: 'Manoj Varma', nakshatra: 'Moolam' }],
        dates: [{ date: '2026-07-19' }],
      },
    ],
  },
  {
    ref: 'KP-2061',
    devoteeName: 'Sreeja Mohan',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Sreeja Mohan', nakshatra: 'Avittam' }],
        dates: [{ date: '2026-07-20' }],
      },
    ],
  },
  {
    ref: 'KP-3111',
    devoteeName: 'Unni Krishnan',
    paymentStatus: 'Pending',
    agentCode: 'SEVA',
    phone: '+91 90370 11223',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [
          { name: 'Unni Krishnan', nakshatra: 'Chathayam' },
          { name: 'Parvathy Unni', nakshatra: 'Uthrattathi' },
        ],
        dates: [{ date: '2026-07-20' }],
      },
    ],
  },
  {
    ref: 'KP-2062',
    devoteeName: 'Bindu Raman',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Bindu Raman', nakshatra: 'Pooruruttathi' }],
        dates: [{ date: '2026-07-21' }],
      },
    ],
  },
  {
    ref: 'KP-2063',
    devoteeName: 'Ajith Kumar',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [{ name: 'Ajith Kumar', nakshatra: 'Aswathi' }],
        dates: [{ date: '2026-07-21' }],
      },
    ],
  },
  {
    ref: 'KP-2039',
    devoteeName: 'Ramesh Pillai',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }],
        dates: [{ date: '2026-06-30', recordStatus: 'Completed' }],
      },
    ],
  },
  {
    ref: 'KP-2040',
    devoteeName: 'Priya Desai',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Anil Menon',
    counterPaidMethod: 'Card',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Priya Desai', nakshatra: 'Revati' }],
        dates: [{ date: '2026-06-29', recordStatus: 'Completed' }],
      },
    ],
  },

  // ---- Additional orders (deterministic, same conventions) — extend the set
  // for a fuller list, covering channels/statuses the verbatim seed doesn't. --
  {
    ref: 'KP-2064',
    devoteeName: 'Kamala Subramaniam',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Kamala Subramaniam', nakshatra: 'Krittika' }],
        dates: [{ date: '2026-07-22' }],
      },
    ],
  },
  {
    ref: 'KP-2065',
    devoteeName: 'Deepak Iyer',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Maha Rudrabhishekam',
        godId: 'shiva',
        people: [{ name: 'Deepak Iyer', nakshatra: 'Vishakha' }],
        dates: [{ date: '2026-07-23', refund: 'pending' }],
      },
    ],
  },
  {
    ref: 'KP-2066',
    devoteeName: 'Radhika Menon',
    paymentStatus: 'Partially Refunded',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [{ name: 'Radhika Menon', nakshatra: 'Purva Phalguni' }],
        dates: [{ date: '2026-07-24', refund: 'refunded' }, { date: '2026-07-25' }],
      },
    ],
  },
  {
    ref: 'KP-2067',
    devoteeName: 'Vasudevan Nair',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Vasudevan Nair', nakshatra: 'Dhanishta' }],
        dates: [{ date: '2026-07-26', recordStatus: 'Completed' }],
      },
    ],
  },
  {
    ref: 'KP-2068',
    devoteeName: 'Anitha Pillai',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Anil Menon',
    counterPaidMethod: 'UPI',
    lineItems: [
      {
        poojaName: 'Durga Saptashati Parayanam',
        godId: 'durga',
        people: [{ name: 'Anitha Pillai', nakshatra: 'Shatabhisha' }],
        dates: [{ date: '2026-07-11' }],
      },
    ],
  },
  {
    ref: 'KP-3112',
    devoteeName: 'Manikandan Pillai',
    paymentStatus: 'Pending',
    agentCode: 'FESTIVE',
    phone: '+91 99013 22110',
    lineItems: [
      {
        poojaName: 'Aditya Hridaya Parayanam',
        godId: 'surya',
        people: [{ name: 'Manikandan Pillai', nakshatra: 'Purva Ashadha' }],
        dates: [{ date: '2026-07-27' }],
      },
    ],
  },
  {
    ref: 'KP-3113',
    devoteeName: 'Sowmya Krishnan',
    paymentStatus: 'Pending',
    agentCode: 'GURUKRIPA',
    phone: '+91 90212 44556',
    lineItems: [
      {
        poojaName: 'Maha Mrityunjaya Homa',
        godId: 'shiva',
        people: [{ name: 'Sowmya Krishnan', nakshatra: 'Uttara Ashadha' }],
        dates: [{ date: '2026-07-28' }],
      },
    ],
  },
  {
    ref: 'KP-2069',
    devoteeName: 'Balachandran Nair',
    paymentStatus: 'Paid',
    channel: 'Counter',
    counterStaff: 'Deepa Nair',
    counterPaidMethod: 'Cash',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Balachandran Nair', nakshatra: 'Shravana' }],
        dates: [{ date: '2026-07-12', recordStatus: 'Completed' }],
      },
    ],
  },
  {
    ref: 'KP-2070',
    devoteeName: 'Revathy Menon',
    paymentStatus: 'Refunded',
    lineItems: [
      {
        poojaName: 'Sri Suktam Archana',
        godId: 'lakshmi',
        people: [{ name: 'Revathy Menon', nakshatra: 'Purva Bhadrapada' }],
        dates: [{ date: '2026-07-29', recordStatus: 'Cancelled' }],
      },
    ],
  },
  {
    ref: 'KP-2071',
    devoteeName: 'Jayanth Kumar',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Satyanarayana Pooja',
        godId: 'vishnu',
        people: [{ name: 'Jayanth Kumar', nakshatra: 'Uttara Bhadrapada' }],
        dates: [{ date: '2026-07-30', reassignment: { priest: 'Gopal Iyer', deadline: '2026-08-15T00:00:00.000Z' } }],
      },
    ],
  },
  {
    ref: 'KP-2072',
    devoteeName: 'Meenakshi Sundaram',
    paymentStatus: 'Paid',
    lineItems: [
      {
        poojaName: 'Ganapathi Homa',
        godId: 'ganesha',
        people: [{ name: 'Meenakshi Sundaram', nakshatra: 'Revati' }],
        dates: [{ date: '2026-07-13', recordStatus: 'Completed' }],
      },
      {
        poojaName: 'Lakshmi Kubera Pooja',
        godId: 'lakshmi',
        people: [{ name: 'Meenakshi Sundaram', nakshatra: 'Revati' }],
        dates: [{ date: '2026-07-31' }],
      },
    ],
  },
  {
    ref: 'KP-3114',
    devoteeName: 'Ashwin Pillai',
    paymentStatus: 'Pending',
    agentCode: 'SEVA',
    phone: '+91 91234 56780',
    lineItems: [
      {
        poojaName: 'Durga Saptashati Parayanam',
        godId: 'durga',
        people: [{ name: 'Ashwin Pillai', nakshatra: 'Ashlesha' }],
        dates: [{ date: '2026-07-14' }],
      },
    ],
  },
]

/** Static, typed fixture — every Pooja Order shown by the Orders screen. */
export const ORDERS: readonly Order[] = SEED_ORDERS.map(buildOrder)
