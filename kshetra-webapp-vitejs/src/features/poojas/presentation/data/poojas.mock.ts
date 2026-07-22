import { svgThumb } from '@/shared/lib/format'

import type { Pooja, PoojaSchedule } from '../../domain/entities/pooja'
import { GOD_NAME_BY_ID } from './gods.mock'

/** Blank recurring schedule with the design's defaults, before overrides. */
function sched(over: Partial<PoojaSchedule>): PoojaSchedule {
  return {
    frequency: 'none',
    startDate: '2026-01-05',
    weekdays: [],
    monthlyMode: 'dom',
    monthlyDom: '1',
    monthlyOrdinal: 'first',
    monthlyWeekday: 1,
    customUnit: 'weeks',
    customInterval: '1',
    endMode: 'never',
    endDate: '',
    endCount: '12',
    ...over,
  }
}

type Seed = Omit<Pooja, 'godNames'>

// Curated catalogue — mirrors the design's buildPoojas() (30 poojas) verbatim.
const SEED: Seed[] = [
  { id: 'PJ-1001', godIds: ['ganesha'], name: 'Ganapathi Homa', offlinePrice: 2100, onlinePrice: 2300, incentive: 300, status: 'Active', sortOrder: 1, special: true, cardImage: svgThumb('GH', '#8C001A'), cardDesc: 'Clears obstacles before any new venture.', bannerImage: svgThumb('GH', '#A8761A'), bannerDesc: 'Invoke Lord Ganesha with the Ganapathi Homa.', schedule: sched({ frequency: 'weekly', weekdays: [2, 5] }), specificDates: [{ date: '2026-04-14', offlinePrice: 2600, onlinePrice: 2800, incentive: 300 }, { date: '2026-06-25', offlinePrice: 2100, onlinePrice: 2300, incentive: 250 }, { date: '2026-08-27', offlinePrice: 2600, onlinePrice: 2800, incentive: 300 }], unavailable: [] },
  { id: 'PJ-1002', godIds: ['shiva'], name: 'Maha Rudrabhishekam', offlinePrice: 4800, onlinePrice: 5000, incentive: 500, status: 'Active', sortOrder: 2, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1003', godIds: ['lakshmi'], name: 'Lakshmi Kubera Pooja', offlinePrice: 3200, onlinePrice: 3400, status: 'Active', sortOrder: 3, special: true, cardImage: null, cardDesc: 'For prosperity and steady wealth.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'monthly', monthlyMode: 'dom', monthlyDom: '15' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1004', godIds: ['surya'], name: 'Aditya Hridaya Parayanam', offlinePrice: 1500, onlinePrice: 1600, status: 'Active', sortOrder: 4, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1005', godIds: ['durga'], name: 'Durga Saptashati Parayanam', offlinePrice: 1100, onlinePrice: 1200, status: 'Inactive', sortOrder: 5, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1006', godIds: ['vishnu'], name: 'Satyanarayana Pooja', offlinePrice: 751, onlinePrice: 851, status: 'Active', sortOrder: 6, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1007', godIds: ['ganesha', 'shiva', 'vishnu'], name: 'Trimurti Archana', offlinePrice: 501, onlinePrice: 601, status: 'Active', sortOrder: 7, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1008', godIds: ['kartikeya'], name: 'Skanda Shashti Pooja', offlinePrice: 900, onlinePrice: 1000, status: 'Active', sortOrder: 8, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1009', godIds: ['shiva'], name: 'Maha Mrityunjaya Homa', offlinePrice: 5500, onlinePrice: 5700, incentive: 500, status: 'Active', sortOrder: 9, special: true, cardImage: svgThumb('MM', '#1F6F5C'), cardDesc: 'Homa for healing and longevity.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'yearly', startDate: '2026-07-15' }), specificDates: [{ date: '2026-08-15', offlinePrice: 6500, onlinePrice: 6700 }, { date: '2026-11-12', offlinePrice: 6000, onlinePrice: 6200 }], unavailable: [{ start: '2026-09-01', end: '2026-09-07' }] },
  { id: 'PJ-1010', godIds: ['lakshmi'], name: 'Sri Suktam Archana', offlinePrice: 251, onlinePrice: 301, status: 'Active', sortOrder: 10, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1011', godIds: ['shiva'], name: 'Shiva-Parvati Kalyanam', offlinePrice: 7500, onlinePrice: 7700, incentive: 750, status: 'Inactive', sortOrder: 11, special: true, cardImage: null, cardDesc: 'The celestial wedding ceremony.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'custom', customUnit: 'weeks', customInterval: '2', weekdays: [6], endMode: 'after', endCount: '10' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1012', godIds: ['hanuman'], name: 'Sundarakanda Parayanam', offlinePrice: 900, onlinePrice: 1000, status: 'Active', sortOrder: 12, special: true, cardImage: null, cardDesc: '', bannerImage: svgThumb('Ha', '#9A3B6E'), bannerDesc: 'Weekly Hanuman parayanam for strength and courage.', schedule: sched({ frequency: 'weekly', weekdays: [6] }), specificDates: [], unavailable: [] },
  { id: 'PJ-1013', godIds: ['saraswati'], name: 'Saraswati Pooja', offlinePrice: 501, onlinePrice: 601, status: 'Active', sortOrder: 13, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1014', godIds: ['venkateswara'], name: 'Govinda Sahasranama Archana', offlinePrice: 1100, onlinePrice: 1200, status: 'Active', sortOrder: 14, special: true, cardImage: svgThumb('Ve', '#1F6F8C'), cardDesc: 'Recite the thousand names of Govinda.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'monthly', monthlyMode: 'dow', monthlyOrdinal: 'first', monthlyWeekday: 6 }), specificDates: [], unavailable: [] },
  { id: 'PJ-1015', godIds: ['rama'], name: 'Sita Rama Maha Kalyanam', offlinePrice: 11000, onlinePrice: 11500, incentive: 1000, status: 'Active', sortOrder: 15, special: true, cardImage: svgThumb('SR', '#A8761A'), cardDesc: 'The grand celestial wedding of Sita and Rama.', bannerImage: svgThumb('SR', '#8C001A'), bannerDesc: 'Sita Rama Kalyanam — Sri Rama Navami special.', schedule: sched({ frequency: 'yearly', startDate: '2026-03-26' }), specificDates: [{ date: '2026-04-17', offlinePrice: 12000, onlinePrice: 12500 }], unavailable: [] },
  { id: 'PJ-1016', godIds: ['krishna'], name: 'Krishna Janmashtami Pooja', offlinePrice: 2100, onlinePrice: 2300, incentive: 250, status: 'Active', sortOrder: 16, special: true, cardImage: null, cardDesc: 'Midnight celebration of Krishna’s birth.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'none' }), specificDates: [{ date: '2026-09-04', offlinePrice: 2500, onlinePrice: 2700 }], unavailable: [{ start: '2026-09-05', end: '2026-09-05' }] },
  { id: 'PJ-1017', godIds: ['narasimha'], name: 'Narasimha Homa', offlinePrice: 4800, onlinePrice: 5000, status: 'Inactive', sortOrder: 17, special: true, cardImage: null, cardDesc: 'Fierce protection homa.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'monthly', monthlyMode: 'dom', monthlyDom: '14', endMode: 'after', endCount: '12' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1018', godIds: ['ayyappa'], name: 'Ayyappa Padi Pooja', offlinePrice: 1500, onlinePrice: 1600, status: 'Active', sortOrder: 18, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1019', godIds: ['subramanya'], name: 'Shashti Abhishekam', offlinePrice: 751, onlinePrice: 851, status: 'Active', sortOrder: 19, special: true, cardImage: null, cardDesc: 'Monthly Shashti abhishekam for Lord Subramanya.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'monthly', monthlyMode: 'dow', monthlyOrdinal: 'last', monthlyWeekday: 2 }), specificDates: [], unavailable: [] },
  { id: 'PJ-1020', godIds: ['parvati'], name: 'Gauri Pooja', offlinePrice: 501, onlinePrice: 601, status: 'Active', sortOrder: 20, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1021', godIds: ['kali'], name: 'Kali Homa', offlinePrice: 3200, onlinePrice: 3400, status: 'Active', sortOrder: 21, special: true, cardImage: null, cardDesc: 'Daily homa through the Navaratri period.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'daily', startDate: '2026-10-11', endMode: 'after', endCount: '9' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1022', godIds: ['annapurna'], name: 'Annadana Sankalpam', offlinePrice: 101, onlinePrice: 151, status: 'Active', sortOrder: 22, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
  { id: 'PJ-1023', godIds: ['navagraha'], name: 'Navagraha Shanti Homa', offlinePrice: 2100, onlinePrice: 2300, status: 'Active', sortOrder: 23, special: true, cardImage: null, cardDesc: 'Pacifies the nine planetary influences.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'custom', customUnit: 'months', customInterval: '2', endMode: 'on', endDate: '2026-12-31' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1024', godIds: ['ganesha'], name: 'Sankashti Chaturthi Pooja', offlinePrice: 751, onlinePrice: 851, status: 'Active', sortOrder: 24, special: true, cardImage: null, cardDesc: 'Monthly Sankashti vrata for Lord Ganesha.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'monthly', monthlyMode: 'dom', monthlyDom: '4' }), specificDates: [{ date: '2026-08-12', offlinePrice: 951, onlinePrice: 1051 }], unavailable: [] },
  { id: 'PJ-1025', godIds: ['shiva'], name: 'Pradosham Abhishekam', offlinePrice: 1100, onlinePrice: 1200, status: 'Active', sortOrder: 25, special: true, cardImage: null, cardDesc: 'Twilight abhishekam on Pradosham days.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'custom', customUnit: 'weeks', customInterval: '2', weekdays: [6] }), specificDates: [], unavailable: [] },
  { id: 'PJ-1026', godIds: ['lakshmi'], name: 'Varalakshmi Vratam', offlinePrice: 2100, onlinePrice: 2300, status: 'Active', sortOrder: 26, special: true, cardImage: null, cardDesc: '', bannerImage: svgThumb('VL', '#A8761A'), bannerDesc: 'Varalakshmi Vratam — the boon-granting Lakshmi.', schedule: sched({ frequency: 'yearly', startDate: '2026-08-07' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1027', godIds: ['vishnu', 'lakshmi'], name: 'Lakshmi Narayana Pooja', offlinePrice: 1500, onlinePrice: 1600, status: 'Active', sortOrder: 27, special: true, cardImage: svgThumb('LN', '#1F6F8C'), cardDesc: 'Joint worship of Lakshmi and Narayana.', bannerImage: svgThumb('LN', '#A8761A'), bannerDesc: 'Harmony, prosperity, and well-being.', schedule: sched({ frequency: 'yearly', startDate: '2026-11-01' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1028', godIds: ['durga'], name: 'Chandi Homa', offlinePrice: 5500, onlinePrice: 5700, status: 'Inactive', sortOrder: 28, special: true, cardImage: null, cardDesc: 'Grand Chandi homa on festival days only.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'none' }), specificDates: [{ date: '2026-10-17', offlinePrice: 6500, onlinePrice: 6700 }, { date: '2026-10-19', offlinePrice: 6500, onlinePrice: 6700 }], unavailable: [] },
  { id: 'PJ-1029', godIds: ['surya'], name: 'Ratha Saptami Pooja', offlinePrice: 1100, onlinePrice: 1200, status: 'Active', sortOrder: 29, special: true, cardImage: null, cardDesc: 'Surya worship on Ratha Saptami.', bannerImage: null, bannerDesc: '', schedule: sched({ frequency: 'yearly', startDate: '2026-01-25' }), specificDates: [], unavailable: [] },
  { id: 'PJ-1030', godIds: ['subramanya', 'ganesha'], name: 'Skanda Ganapathi Homa', offlinePrice: 900, onlinePrice: 1000, status: 'Inactive', sortOrder: 30, special: false, cardImage: null, cardDesc: '', bannerImage: null, bannerDesc: '', schedule: null, specificDates: [], unavailable: [] },
]

export const POOJAS: Pooja[] = SEED.map((p) => ({
  ...p,
  godNames: p.godIds.map((id) => GOD_NAME_BY_ID[id] ?? id),
}))
