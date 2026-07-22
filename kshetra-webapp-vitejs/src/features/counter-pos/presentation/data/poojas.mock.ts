import type { Pooja } from '@/features/counter-pos/domain/entities/pooja'

/** Default pooja catalogue (copied verbatim from the DC prototype's DEFAULT_POOJAS seed). */
export const POOJAS: readonly Pooja[] = [
  { id: 'dp1', name: 'Ganapathi Homa', godIds: ['ganesha'], offlinePrice: 2100, status: 'Active' },
  { id: 'dp2', name: 'Ganesha Archana', godIds: ['ganesha'], offlinePrice: 101, status: 'Active' },
  { id: 'dp3', name: 'Sankashti Chaturthi Pooja', godIds: ['ganesha'], offlinePrice: 751, status: 'Active' },
  { id: 'dp4', name: 'Maha Rudrabhishekam', godIds: ['shiva'], offlinePrice: 4800, status: 'Active' },
  { id: 'dp5', name: 'Shiva Archana Laghu', godIds: ['shiva'], offlinePrice: 251, status: 'Active' },
  { id: 'dp6', name: 'Satyanarayana Pooja', godIds: ['vishnu'], offlinePrice: 2500, status: 'Active' },
  { id: 'dp7', name: 'Vishnu Sahasranama Archana', godIds: ['vishnu'], offlinePrice: 501, status: 'Active' },
  { id: 'dp8', name: 'Lakshmi Kubera Pooja', godIds: ['lakshmi'], offlinePrice: 3200, status: 'Active' },
  { id: 'dp9', name: 'Sri Suktam Archana', godIds: ['lakshmi'], offlinePrice: 351, status: 'Active' },
  { id: 'dp10', name: 'Durga Saptashati Parayanam', godIds: ['durga'], offlinePrice: 2800, status: 'Active' },
  { id: 'dp11', name: 'Aditya Hridaya Parayanam', godIds: ['surya'], offlinePrice: 1100, status: 'Active' },
  { id: 'dp12', name: 'Subrahmanya Archana', godIds: ['kartikeya'], offlinePrice: 301, status: 'Active' },
  { id: 'dp13', name: 'Hanuman Chalisa Parayanam', godIds: ['hanuman'], offlinePrice: 451, status: 'Active' },
]
