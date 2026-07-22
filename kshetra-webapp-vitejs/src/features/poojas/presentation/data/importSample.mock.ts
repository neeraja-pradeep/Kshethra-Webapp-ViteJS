// Demo CSV loaded by the "Load sample data" link in the import modal. Mirrors the
// design's seed exactly, including the two intentionally-invalid rows (blank name,
// non-numeric price) so the preview table shows both valid and invalid states.
export const SAMPLE_POOJAS_CSV = [
  'God,Pooja Name,Offline Price,Online Price,Status,Sort Order,Special',
  'Ganesha,Ganapathi Maha Homa,2100,2300,Active,2001,Yes',
  'Shiva,Maha Rudrabhishekam,4800,5000,Active,2002,No',
  'Lakshmi,Vara Lakshmi Pooja,3200,3400,Active,2003,Yes',
  'Surya,Aditya Hridaya Parayanam,1100,1200,Active,2004,No',
  'Vishnu,,5500,5700,Active,2005,No',
  'Durga,Chandi Homa,abc,9000,Active,2006,No',
  'Kartikeya,Skanda Shashti Pooja,1500,1600,Active,2007,No',
  'Hanuman,Sundarakanda Parayanam,900,1000,Active,2008,No',
].join('\n')

// Blank starter template offered via "Download template" — headers + two example rows.
export const POOJAS_CSV_TEMPLATE = [
  'God,Pooja Name,Offline Price,Online Price,Status,Sort Order,Special',
  'Ganesha,Ganapathi Homa,2100,2300,Active,201,Yes',
  'Shiva,Maha Rudrabhishekam,4800,5000,Active,202,No',
].join('\n')
