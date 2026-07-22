import type { MediaTrack } from '@/features/media/domain/entities/media-track'

/**
 * Static seed fixtures — copied verbatim from the DC prototype's
 * `buildTracks()`. `audioName` mirrors the DC's slug transform of the title.
 */
export const MEDIA_TRACKS: MediaTrack[] = [
  { id: 'MD-1', title: 'Om Namah Shivaya (108x)', artist: 'Pandit Jasraj', audioName: 'om-namah-shivaya-108x-.mp3', cover: null, homescreen: true, plays: 18420, status: 'Active' },
  { id: 'MD-2', title: 'Vishnu Sahasranama', artist: 'M. S. Subbulakshmi', audioName: 'vishnu-sahasranama.mp3', cover: null, homescreen: true, plays: 42310, status: 'Active' },
  { id: 'MD-3', title: 'Lingashtakam', artist: 'Uma Mohan', audioName: 'lingashtakam.mp3', cover: null, homescreen: false, plays: 9120, status: 'Active' },
  { id: 'MD-4', title: 'Hanuman Chalisa', artist: 'Hariharan', audioName: 'hanuman-chalisa.mp3', cover: null, homescreen: true, plays: 55600, status: 'Active' },
  { id: 'MD-5', title: 'Lalitha Sahasranama', artist: 'Bombay Sisters', audioName: 'lalitha-sahasranama.mp3', cover: null, homescreen: false, plays: 7340, status: 'Active' },
  { id: 'MD-6', title: 'Gayatri Mantra (1008x)', artist: 'Anuradha Paudwal', audioName: 'gayatri-mantra-1008x-.mp3', cover: null, homescreen: false, plays: 12890, status: 'Active' },
  { id: 'MD-7', title: 'Bhaja Govindam', artist: 'M. S. Subbulakshmi', audioName: 'bhaja-govindam.mp3', cover: null, homescreen: false, plays: 4210, status: 'Inactive' },
  { id: 'MD-8', title: 'Aditya Hridayam', artist: 'Ghantasala', audioName: 'aditya-hridayam.mp3', cover: null, homescreen: false, plays: 3980, status: 'Active' },
  { id: 'MD-9', title: 'Suprabhatam', artist: 'M. S. Subbulakshmi', audioName: 'suprabhatam.mp3', cover: null, homescreen: true, plays: 61200, status: 'Active' },
  { id: 'MD-10', title: 'Rudram Chamakam', artist: 'Vedic Chants Ensemble', audioName: 'rudram-chamakam.mp3', cover: null, homescreen: false, plays: 2760, status: 'Inactive' },
]
