
import { Site, Chronology } from './types';

export const TN_SITES: Site[] = [
  {
    id: 'adichanallur',
    name: 'Adichanallur',
    location: { lat: 8.6291, lng: 77.8765, district: 'Thoothukudi' },
    chronology: [Chronology.MEGALITHIC],
    description: 'An extensive urn-burial site containing a vast number of skeletal remains and iron artifacts.',
    artifacts: [
      { name: 'Urns', material: 'Terracotta', category: 'pottery', description: 'Large burial urns often containing skeletons.' },
      { name: 'Swords', material: 'Iron', category: 'tool', description: 'Double-edged iron swords found in burials.' },
      { name: 'Gold Diadems', material: 'Gold', category: 'ornament', description: 'Small gold leaf ornaments for the forehead.' }
    ],
    structures: ['Urn burial pits', 'Habitation mounds']
  },
  {
    id: 'keezhadi',
    name: 'Keezhadi',
    location: { lat: 9.8631, lng: 78.1883, district: 'Sivaganga' },
    chronology: [Chronology.SANGAM, Chronology.EARLY_HISTORIC],
    description: 'A large urban settlement showing advanced civic planning and Tamil-Brahmi script.',
    artifacts: [
      { name: 'Tamil-Brahmi Potsherds', material: 'Terracotta', category: 'pottery', description: 'Pottery inscribed with personal names.' },
      { name: 'Glass Beads', material: 'Glass', category: 'bead', description: 'Evidence of local manufacturing of luxury items.' },
      { name: 'Game Pieces', material: 'Terracotta', category: 'other', description: 'Dice and hopscotches indicating leisure activities.' }
    ],
    structures: ['Brick walls', 'Ring wells', 'Open drainage system']
  },
  {
    id: 'kodumanal',
    name: 'Kodumanal',
    location: { lat: 11.1090, lng: 77.4580, district: 'Erode' },
    chronology: [Chronology.MEGALITHIC, Chronology.SANGAM],
    description: 'A major industrial and trade center specializing in semi-precious stone beads and iron smelting.',
    artifacts: [
      { name: 'Carnelian Beads', material: 'Carnelian', category: 'bead', description: 'Etched beads indicating trade with Indus region.' },
      { name: 'Iron Furnaces', material: 'Iron', category: 'other', description: 'Remains of high-quality steel production.' },
      { name: 'Punch-marked Coins', material: 'Silver', category: 'coin', description: 'Early Indian coinage used in trade.' }
    ],
    structures: ['Stone circles', 'Iron smelting furnaces', 'Cist burials']
  },
  {
    id: 'arikamedu',
    name: 'Arikamedu',
    location: { lat: 11.8942, lng: 79.8290, district: 'Puducherry' },
    chronology: [Chronology.EARLY_HISTORIC],
    description: 'An Indo-Roman trading station on the Coromandel coast.',
    artifacts: [
      { name: 'Amphorae', material: 'Terracotta', category: 'pottery', description: 'Mediterranean wine jars.' },
      { name: 'Rouletted Ware', material: 'Terracotta', category: 'pottery', description: 'Fine pottery with concentric machine-turned patterns.' },
      { name: 'Arretine Ware', material: 'Terracotta', category: 'pottery', description: 'Red glazed Italian pottery.' }
    ],
    structures: ['Warehouse remains', 'Brick tanks', 'Wharfs']
  },
  {
    id: 'porunthal',
    name: 'Porunthal',
    location: { lat: 10.5100, lng: 77.4800, district: 'Dindigul' },
    chronology: [Chronology.SANGAM],
    description: 'Noted for the discovery of paddy in grave urns and rich bead deposits.',
    artifacts: [
      { name: 'Paddy Grains', material: 'Organic', category: 'other', description: 'Carbonized rice found in burial urns.' },
      { name: 'Banded Agate Beads', material: 'Agate', category: 'bead', description: 'High quality imported semi-precious stones.' },
      { name: 'Graffiti Pottery', material: 'Terracotta', category: 'pottery', description: 'Post-firing markings on black and red ware.' }
    ],
    structures: ['Habitation mounds', 'Megalithic burials']
  }
];
