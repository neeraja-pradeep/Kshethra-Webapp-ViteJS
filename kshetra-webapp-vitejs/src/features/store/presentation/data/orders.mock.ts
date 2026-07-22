import type { Order, OrderAddress, OrderCustomer, OrderLineItem, OrderRefundEntry } from '@/features/store/domain/entities/order'

function customer(name: string, phone: string, email: string): OrderCustomer {
  return { name, phone, email }
}

function address(name: string, line1: string, line2: string, phone: string): OrderAddress {
  return { name, line1, line2, phone }
}

function items(pairs: ReadonlyArray<readonly [string, number]>): OrderLineItem[] {
  return pairs.map(([productId, quantity]) => ({ productId, quantity }))
}

function order(
  ref: string,
  cust: OrderCustomer | null,
  date: string,
  lineItems: ReadonlyArray<readonly [string, number]>,
  paymentMethod: string,
  paymentStatus: Order['paymentStatus'],
  fulfilmentStatus: Order['fulfilmentStatus'],
  addr: OrderAddress | null,
  refundLog: OrderRefundEntry[] = [],
): Order {
  return {
    ref,
    id: ref,
    customer: cust,
    date,
    items: items(lineItems),
    paymentMethod,
    paymentStatus,
    fulfilmentStatus,
    receiptRef: 'INV-' + ref.split('-')[1],
    address: addr,
    refundLog,
  }
}

/** Seed orders (most recent first) — copied verbatim from the design prototype. */
export const ORDERS: Order[] = [
  order(
    'ORD-4021',
    customer('Anjali Menon', '+91 98470 11234', 'anjali.menon@gmail.com'),
    '2026-07-01',
    [['INC-001', 2], ['LMP-001', 1]],
    'UPI',
    'Paid',
    'Processing',
    address('Anjali Menon', '14 Temple View Apts, MG Road', 'Kochi, Kerala 682016', '+91 98470 11234'),
  ),
  order('ORD-4020', null, '2026-07-01', [['PRD-001', 3]], 'Cash', 'Paid', 'Delivered', null),
  order(
    'ORD-4019',
    customer('Ramesh Iyer', '+91 99620 55010', 'ramesh.iyer@outlook.com'),
    '2026-07-01',
    [['BOK-001', 1], ['RUD-001', 1]],
    'Card',
    'Paid',
    'Packed',
    address('Ramesh Iyer', '3B Sringeri Nagar', 'Bengaluru, Karnataka 560085', '+91 99620 55010'),
  ),
  order('ORD-4018', null, '2026-06-30', [['INC-004', 2], ['LMP-003', 1]], 'Cash', 'Paid', 'Delivered', null),
  order(
    'ORD-4017',
    customer('Suresh Nair', '+91 98950 77821', 'suresh.nair@gmail.com'),
    '2026-06-30',
    [['IDL-001', 1]],
    'Cash on delivery',
    'Pending',
    'Processing',
    address('Suresh Nair', '22 Guruvayur Road', 'Thrissur, Kerala 680001', '+91 98950 77821'),
  ),
  order(
    'ORD-4016',
    customer('Meera Krishnan', '+91 90480 33265', 'meera.k@gmail.com'),
    '2026-06-29',
    [['IDL-002', 1], ['PRD-002', 2]],
    'Card',
    'Paid',
    'Shipped',
    address('Meera Krishnan', '7 Lakshmi Nivas, Mylapore', 'Chennai, Tamil Nadu 600004', '+91 90480 33265'),
  ),
  order('ORD-4015', null, '2026-06-29', [['RUD-002', 1]], 'UPI', 'Paid', 'Delivered', null),
  order(
    'ORD-4014',
    customer('Karthik Rao', '+91 99000 12345', 'karthik.rao@gmail.com'),
    '2026-06-28',
    [['KIT-002', 1], ['KIT-001', 1]],
    'UPI',
    'Refunded',
    'Cancelled',
    address('Karthik Rao', '9 Jubilee Hills', 'Hyderabad, Telangana 500033', '+91 99000 12345'),
    [
      {
        kind: 'Full refund',
        amount: 1300,
        reason: 'Customer changed plans before dispatch',
        user: 'Priya Menon',
        timestamp: '28 Jun 2026, 3:12 pm',
      },
    ],
  ),
  order(
    'ORD-4013',
    customer('Lakshmi Narayan', '+91 98844 90021', 'lakshmi.n@yahoo.com'),
    '2026-06-28',
    [['IDL-003', 1], ['BOK-002', 2]],
    'Card',
    'Partially Refunded',
    'Shipped',
    address('Lakshmi Narayan', '41 Besant Nagar', 'Chennai, Tamil Nadu 600090', '+91 98844 90021'),
    [
      {
        kind: 'Partial refund',
        amount: 120,
        reason: 'One booklet arrived damaged',
        user: 'Priya Menon',
        timestamp: '29 Jun 2026, 11:04 am',
      },
    ],
  ),
  order('ORD-4012', null, '2026-06-27', [['BOK-003', 2], ['PRD-003', 1]], 'Cash', 'Paid', 'Delivered', null),
  order(
    'ORD-4011',
    customer('Deepa Pillai', '+91 90370 88123', 'deepa.pillai@gmail.com'),
    '2026-06-27',
    [['LMP-002', 1], ['LMP-003', 2]],
    'UPI',
    'Paid',
    'Processing',
    address('Deepa Pillai', '5 Marine Drive', 'Ernakulam, Kerala 682031', '+91 90370 88123'),
  ),
  order(
    'ORD-4010',
    customer('Arjun Iyer', '+91 98470 22091', 'arjun.iyer@gmail.com'),
    '2026-06-26',
    [['RUD-003', 1]],
    'Card',
    'Paid',
    'Delivered',
    address('Arjun Iyer', '18 Anna Nagar', 'Chennai, Tamil Nadu 600040', '+91 98470 22091'),
  ),
  order('ORD-4009', null, '2026-06-26', [['INC-002', 3]], 'Cash', 'Paid', 'Delivered', null),
  order(
    'ORD-4008',
    customer('Govind Sharma', '+91 99450 66710', 'govind.sharma@gmail.com'),
    '2026-06-25',
    [['KIT-001', 1], ['BOK-002', 2], ['INC-001', 1]],
    'Net banking',
    'Paid',
    'Shipped',
    address('Govind Sharma', '12 Sector 4, Vashi', 'Navi Mumbai, Maharashtra 400703', '+91 99450 66710'),
  ),
]
