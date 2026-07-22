import type { Product } from '@/features/store/domain/entities/product'

/** Default low-stock alert threshold (units). */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10

function product(id: string, name: string, categoryId: string, price: number, stock: number, status: Product['status']): Product {
  return {
    id,
    name,
    categoryId,
    price,
    stock,
    status,
    description: '',
    images: [],
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    stockLog: [],
  }
}

/** Seed products — copied verbatim from the design prototype. */
export const PRODUCTS: Product[] = [
  product('INC-001', 'Sandalwood Agarbatti (Box of 100)', 'cat-inc', 180, 240, 'Active'),
  product('INC-002', 'Loban Dhoop Cones', 'cat-inc', 120, 8, 'Active'),
  product('INC-003', 'Nag Champa Incense', 'cat-inc', 150, 0, 'Active'),
  product('INC-004', 'Camphor Tablets (50g)', 'cat-inc', 90, 60, 'Active'),
  product('LMP-001', 'Brass Diya (Small)', 'cat-lmp', 250, 45, 'Active'),
  product('LMP-002', 'Panchmukhi Brass Lamp', 'cat-lmp', 1200, 12, 'Active'),
  product('LMP-003', 'Cotton Wicks (Pack of 200)', 'cat-lmp', 60, 300, 'Active'),
  product('LMP-004', 'Akhand Jyoti Oil Lamp', 'cat-lmp', 850, 6, 'Active'),
  product('KIT-001', 'Griha Pravesh Puja Kit', 'cat-kit', 750, 30, 'Active'),
  product('KIT-002', 'Satyanarayan Puja Samagri', 'cat-kit', 550, 18, 'Active'),
  product('KIT-003', 'Navratri Puja Kit', 'cat-kit', 900, 0, 'Inactive'),
  product('IDL-001', 'Brass Ganesha Idol (4in)', 'cat-idl', 1600, 15, 'Active'),
  product('IDL-002', 'Marble Lakshmi Idol', 'cat-idl', 3200, 4, 'Active'),
  product('IDL-003', 'Panchaloha Nataraja (6in)', 'cat-idl', 5400, 3, 'Active'),
  product('BOK-001', 'Bhagavad Gita (Hardcover)', 'cat-bok', 350, 80, 'Active'),
  product('BOK-002', 'Vishnu Sahasranama Booklet', 'cat-bok', 60, 150, 'Active'),
  product('BOK-003', 'Devotional Bhajans (USB)', 'cat-bok', 220, 25, 'Active'),
  product('PRD-001', 'Tirupati Laddu (Pack of 2)', 'cat-prd', 100, 120, 'Active'),
  product('PRD-002', 'Kumkum & Turmeric Set', 'cat-prd', 80, 90, 'Active'),
  product('PRD-003', 'Panchamrit Kit', 'cat-prd', 140, 40, 'Active'),
  product('RUD-001', '5-Mukhi Rudraksha Mala', 'cat-rud', 650, 22, 'Active'),
  product('RUD-002', 'Tulsi Japa Mala', 'cat-rud', 180, 55, 'Active'),
  product('RUD-003', 'Sphatik Crystal Mala', 'cat-rud', 1100, 9, 'Active'),
  product('RUD-004', 'Rudraksha Bracelet', 'cat-rud', 300, 0, 'Active'),
]
