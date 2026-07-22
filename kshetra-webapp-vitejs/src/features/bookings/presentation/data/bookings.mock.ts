import type { Booking, BookingChannel, BookingStatus, PaymentStatus, StatusTone } from '@/features/bookings/domain/entities/booking'

/** Mirrors the prototype's PRICEMAP — per-occurrence pooja price. */
const PRICE_BY_POOJA: Record<string, number> = {
  'Ganapathi Homa': 2100,
  'Satyanarayana Pooja': 751,
  'Maha Rudrabhishekam': 4800,
  'Lakshmi Kubera Pooja': 3200,
  'Aditya Hridaya Parayanam': 1500,
  'Durga Saptashati Parayanam': 1100,
  'Sri Suktam Archana': 251,
  'Maha Mrityunjaya Homa': 5500,
}

/** Mirrors the prototype's PRIESTS roster — offered when reassigning a poojari. */
export const PRIESTS: readonly string[] = ['Sharma Sastrigal', 'Venkatesh Bhattar', 'Krishnan Namboothiri', 'Gopal Iyer', 'Anand Sharma']

/** Mirrors the prototype's PRIEST_BY_GOD default assignment. */
const PRIEST_BY_GOD: Record<string, string> = {
  ganesha: 'Sharma Sastrigal',
  shiva: 'Venkatesh Bhattar',
  vishnu: 'Krishnan Namboothiri',
  lakshmi: 'Gopal Iyer',
  durga: 'Anand Sharma',
  surya: 'Ramesh Dikshit',
}

const GOD_NAME_BY_ID: Record<string, string> = {
  ganesha: 'Ganesha',
  shiva: 'Shiva',
  vishnu: 'Vishnu',
  lakshmi: 'Lakshmi',
  durga: 'Durga',
  surya: 'Surya',
}

/** Poojas flagged "special" in the catalogue (mirrors buildPoojas() seed). */
const SPECIAL_POOJAS = new Set(['Ganapathi Homa', 'Lakshmi Kubera Pooja', 'Maha Mrityunjaya Homa'])

const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  Pending: 'warning',
  Completed: 'success',
  Cancelled: 'danger',
}

const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = {
  Paid: 'success',
  Pending: 'neutral',
  Refunded: 'neutral',
  'Partially Refunded': 'warning',
}

interface SeedPerson {
  readonly name: string
  readonly nakshatra: string
}

interface SeedBooking {
  readonly id: string
  readonly orderRef: string
  readonly poojaName: string
  readonly godId: string
  readonly date: string
  readonly people: readonly SeedPerson[]
  readonly bookingStatus: BookingStatus
  readonly paymentStatus: PaymentStatus
  readonly devotee: string
  readonly channel: BookingChannel
  readonly counterStaff: string | null
}

/**
 * Transcribed verbatim from the DC prototype's `buildBookings()` seed, with
 * channel/counterStaff resolved exactly as the prototype's state initializer
 * does: an explicit `channel` wins; otherwise every third booking (by seed
 * index) synthesizes as a Counter sale rotating through COUNTER_STAFF, the
 * rest are Mobile app.
 */
const SEED_BOOKINGS: readonly SeedBooking[] = [
  { id: 'B-1', orderRef: 'KP-2041', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-01', people: [{ name: 'Lakshmi Narayan Iyer', nakshatra: 'Ashwini' }, { name: 'Arjun Iyer', nakshatra: 'Rohini' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Lakshmi Narayan Iyer', channel: 'Counter', counterStaff: 'Ravi Kumar' },
  { id: 'B-2', orderRef: 'KP-2041', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-08', people: [{ name: 'Lakshmi Narayan Iyer', nakshatra: 'Ashwini' }, { name: 'Arjun Iyer', nakshatra: 'Rohini' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Lakshmi Narayan Iyer', channel: 'Mobile app', counterStaff: null },
  { id: 'B-3', orderRef: 'KP-2041', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-01', people: [{ name: 'Arjun Iyer', nakshatra: 'Rohini' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Lakshmi Narayan Iyer', channel: 'Mobile app', counterStaff: null },
  { id: 'B-4', orderRef: 'KP-2042', poojaName: 'Maha Rudrabhishekam', godId: 'shiva', date: '2026-07-01', people: [{ name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }], bookingStatus: 'Completed', paymentStatus: 'Paid', devotee: 'Ramesh Pillai', channel: 'Counter', counterStaff: 'Ravi Kumar' },
  { id: 'B-5', orderRef: 'KP-2043', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-07-01', people: [{ name: 'Meera Krishnan', nakshatra: 'Hasta' }, { name: 'Suresh Nair', nakshatra: 'Pushya' }, { name: 'Anjali Menon', nakshatra: 'Chitra' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Meera Krishnan', channel: 'Mobile app', counterStaff: null },
  { id: 'B-6', orderRef: 'KP-2044', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-01', people: [{ name: 'Mohan Das', nakshatra: 'Swati' }], bookingStatus: 'Cancelled', paymentStatus: 'Refunded', devotee: 'Mohan Das', channel: 'Mobile app', counterStaff: null },
  { id: 'B-7', orderRef: 'KP-2045', poojaName: 'Durga Saptashati Parayanam', godId: 'durga', date: '2026-07-01', people: [{ name: 'Gita Sharma', nakshatra: 'Magha' }], bookingStatus: 'Completed', paymentStatus: 'Paid', devotee: 'Gita Sharma', channel: 'Counter', counterStaff: 'Anil Menon' },
  { id: 'B-8', orderRef: 'KP-2046', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-01', people: [{ name: 'Priya Desai', nakshatra: 'Revati' }, { name: 'Vivek Rao', nakshatra: 'Anuradha' }], bookingStatus: 'Pending', paymentStatus: 'Partially Refunded', devotee: 'Priya Desai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-9', orderRef: 'KP-2046', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-15', people: [{ name: 'Priya Desai', nakshatra: 'Revati' }, { name: 'Vivek Rao', nakshatra: 'Anuradha' }], bookingStatus: 'Cancelled', paymentStatus: 'Partially Refunded', devotee: 'Priya Desai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-10', orderRef: 'KP-2047', poojaName: 'Maha Mrityunjaya Homa', godId: 'shiva', date: '2026-07-02', people: [{ name: 'Suresh Nair', nakshatra: 'Jyeshtha' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Suresh Nair', channel: 'Counter', counterStaff: 'Deepa Nair' },
  { id: 'B-11', orderRef: 'KP-2048', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-02', people: [{ name: 'Kavya Reddy', nakshatra: 'Uttara Phalguni' }, { name: 'Mohan Das', nakshatra: 'Swati' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Kavya Reddy', channel: 'Mobile app', counterStaff: null },
  { id: 'B-12', orderRef: 'KP-2048', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-09', people: [{ name: 'Kavya Reddy', nakshatra: 'Uttara Phalguni' }, { name: 'Mohan Das', nakshatra: 'Swati' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Kavya Reddy', channel: 'Mobile app', counterStaff: null },
  { id: 'B-13', orderRef: 'KP-2048', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-16', people: [{ name: 'Kavya Reddy', nakshatra: 'Uttara Phalguni' }, { name: 'Mohan Das', nakshatra: 'Swati' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Kavya Reddy', channel: 'Counter', counterStaff: 'Deepa Nair' },
  { id: 'B-14', orderRef: 'KP-2049', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-03', people: [{ name: 'Anjali Menon', nakshatra: 'Chitra' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Anjali Menon', channel: 'Mobile app', counterStaff: null },
  { id: 'B-15', orderRef: 'KP-2050', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-07-03', people: [{ name: 'Vivek Rao', nakshatra: 'Anuradha' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Vivek Rao', channel: 'Mobile app', counterStaff: null },
  { id: 'B-16', orderRef: 'KP-2051', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-05', people: [{ name: 'Sita Raman', nakshatra: 'Shravana' }, { name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Sita Raman', channel: 'Counter', counterStaff: 'Anil Menon' },
  { id: 'B-17', orderRef: 'KP-2052', poojaName: 'Maha Rudrabhishekam', godId: 'shiva', date: '2026-07-05', people: [{ name: 'Gita Sharma', nakshatra: 'Magha' }], bookingStatus: 'Cancelled', paymentStatus: 'Refunded', devotee: 'Gita Sharma', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A1', orderRef: 'KP-3101', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-04', people: [{ name: 'Rohan Nair', nakshatra: 'Ashwini' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Rohan Nair', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A2', orderRef: 'KP-3102', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-05', people: [{ name: 'Divya Menon', nakshatra: 'Rohini' }, { name: 'Suresh Menon', nakshatra: 'Pushya' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Divya Menon', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A3', orderRef: 'KP-3103', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-07-06', people: [{ name: 'Arun Kumar', nakshatra: 'Hasta' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Arun Kumar', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A4', orderRef: 'KP-3104', poojaName: 'Durga Saptashati Parayanam', godId: 'durga', date: '2026-07-02', people: [{ name: 'Latha Rao', nakshatra: 'Magha' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Latha Rao', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A5', orderRef: 'KP-3105', poojaName: 'Maha Rudrabhishekam', godId: 'shiva', date: '2026-07-08', people: [{ name: 'Prakash Iyer', nakshatra: 'Mrigashira' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Prakash Iyer', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A6', orderRef: 'KP-3106', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-05', people: [{ name: 'Meena Pillai', nakshatra: 'Revati' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Meena Pillai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-A7', orderRef: 'KP-3106', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-12', people: [{ name: 'Meena Pillai', nakshatra: 'Revati' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Meena Pillai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-18', orderRef: 'KP-2053', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-08', people: [{ name: 'Meera Krishnan', nakshatra: 'Hasta' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Meera Krishnan', channel: 'Counter', counterStaff: 'Anil Menon' },
  { id: 'B-F1', orderRef: 'KP-2054', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-15', people: [{ name: 'Harish Menon', nakshatra: 'Bharani' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Harish Menon', channel: 'Counter', counterStaff: 'Ravi Kumar' },
  { id: 'B-F2', orderRef: 'KP-2055', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-15', people: [{ name: 'Rekha Warrier', nakshatra: 'Punarvasu' }, { name: 'Sanjay Warrier', nakshatra: 'Ardra' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Rekha Warrier', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F3', orderRef: 'KP-3107', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-15', people: [{ name: 'Nithya Balan', nakshatra: 'Chitra' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Nithya Balan', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F4', orderRef: 'KP-2056', poojaName: 'Maha Rudrabhishekam', godId: 'shiva', date: '2026-07-16', people: [{ name: 'Devraj Kurup', nakshatra: 'Thiruvathira' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Devraj Kurup', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F5', orderRef: 'KP-3108', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-16', people: [{ name: 'Shalini Nair', nakshatra: 'Makam' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Shalini Nair', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F6', orderRef: 'KP-2057', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-07-17', people: [{ name: 'Vinod Kaimal', nakshatra: 'Pooram' }, { name: 'Asha Kaimal', nakshatra: 'Uthram' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Vinod Kaimal', channel: 'Counter', counterStaff: 'Deepa Nair' },
  { id: 'B-F7', orderRef: 'KP-3109', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-17', people: [{ name: 'Kiran Namboodiri', nakshatra: 'Atham' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Kiran Namboodiri', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F8', orderRef: 'KP-2058', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-18', people: [{ name: 'Lakshmi Ammal', nakshatra: 'Rohini' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Lakshmi Ammal', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F9', orderRef: 'KP-2058', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-18', people: [{ name: 'Lakshmi Ammal', nakshatra: 'Rohini' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Lakshmi Ammal', channel: 'Counter', counterStaff: 'Anil Menon' },
  { id: 'B-F10', orderRef: 'KP-3110', poojaName: 'Maha Mrityunjaya Homa', godId: 'shiva', date: '2026-07-18', people: [{ name: 'Rajan Pillai', nakshatra: 'Anizham' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Rajan Pillai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F11', orderRef: 'KP-2059', poojaName: 'Aditya Hridaya Parayanam', godId: 'surya', date: '2026-07-18', people: [{ name: 'Geetha Kumari', nakshatra: 'Karthika' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Geetha Kumari', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F12', orderRef: 'KP-2060', poojaName: 'Durga Saptashati Parayanam', godId: 'durga', date: '2026-07-19', people: [{ name: 'Manoj Varma', nakshatra: 'Moolam' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Manoj Varma', channel: 'Counter', counterStaff: 'Ravi Kumar' },
  { id: 'B-F13', orderRef: 'KP-2061', poojaName: 'Ganapathi Homa', godId: 'ganesha', date: '2026-07-20', people: [{ name: 'Sreeja Mohan', nakshatra: 'Avittam' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Sreeja Mohan', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F14', orderRef: 'KP-3111', poojaName: 'Satyanarayana Pooja', godId: 'vishnu', date: '2026-07-20', people: [{ name: 'Unni Krishnan', nakshatra: 'Chathayam' }, { name: 'Parvathy Unni', nakshatra: 'Uthrattathi' }], bookingStatus: 'Pending', paymentStatus: 'Pending', devotee: 'Unni Krishnan', channel: 'Mobile app', counterStaff: null },
  { id: 'B-F15', orderRef: 'KP-2062', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-07-21', people: [{ name: 'Bindu Raman', nakshatra: 'Pooruruttathi' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Bindu Raman', channel: 'Counter', counterStaff: 'Deepa Nair' },
  { id: 'B-F16', orderRef: 'KP-2063', poojaName: 'Sri Suktam Archana', godId: 'lakshmi', date: '2026-07-21', people: [{ name: 'Ajith Kumar', nakshatra: 'Aswathi' }], bookingStatus: 'Pending', paymentStatus: 'Paid', devotee: 'Ajith Kumar', channel: 'Mobile app', counterStaff: null },
  { id: 'B-19', orderRef: 'KP-2039', poojaName: 'Maha Rudrabhishekam', godId: 'shiva', date: '2026-06-30', people: [{ name: 'Ramesh Pillai', nakshatra: 'Mrigashira' }], bookingStatus: 'Completed', paymentStatus: 'Paid', devotee: 'Ramesh Pillai', channel: 'Mobile app', counterStaff: null },
  { id: 'B-20', orderRef: 'KP-2040', poojaName: 'Lakshmi Kubera Pooja', godId: 'lakshmi', date: '2026-06-29', people: [{ name: 'Priya Desai', nakshatra: 'Revati' }], bookingStatus: 'Completed', paymentStatus: 'Paid', devotee: 'Priya Desai', channel: 'Counter', counterStaff: 'Anil Menon' },
]

function buildBookings(): Booking[] {
  const orderTotals = new Map<string, number>()
  for (const b of SEED_BOOKINGS) {
    const price = PRICE_BY_POOJA[b.poojaName] ?? 1500
    orderTotals.set(b.orderRef, (orderTotals.get(b.orderRef) ?? 0) + price)
  }

  const rows: Booking[] = []
  SEED_BOOKINGS.forEach((b) => {
    const amount = PRICE_BY_POOJA[b.poojaName] ?? 1500
    b.people.forEach((person, idx) => {
      rows.push({
        id: `${b.id}:${idx}`,
        bookingId: b.id,
        poojaName: b.poojaName,
        godName: GOD_NAME_BY_ID[b.godId] ?? b.godId,
        special: SPECIAL_POOJAS.has(b.poojaName),
        poojaDate: b.date,
        person: person.name,
        nakshatra: person.nakshatra,
        channel: b.channel,
        counterStaff: b.channel === 'Counter' ? b.counterStaff : null,
        devoteeAccountName: b.channel === 'Mobile app' ? b.devotee : null,
        poojari: PRIEST_BY_GOD[b.godId] ?? 'Temple priest',
        status: b.bookingStatus,
        statusTone: STATUS_TONE[b.bookingStatus],
        orderRef: b.orderRef,
        paymentStatus: b.paymentStatus,
        paymentTone: PAYMENT_TONE[b.paymentStatus],
        amount,
        receiptRef: `RCPT-${b.orderRef.split('-')[1] ?? b.orderRef}`,
        orderTotal: orderTotals.get(b.orderRef) ?? amount,
      })
    })
  })
  return rows
}

/** Typed static fixture — one row per person, per pooja date (57 rows). */
export const BOOKINGS: Booking[] = buildBookings()
