// ─── Single Source of Truth for Peelamedu Zones & Streets ─────────────────────

export const PEELAMEDU_ZONES = [
  {
    id: 'peelamedu-psg',
    name: 'Peelamedu – PSG Zone',
    shortName: 'PSG Zone',
    area: 'Peelamedu',
    driverEmail: 'murugan.s@cleanconnect.gov.in',
    driverName: 'Murugan S',
    vehicleId: 'GCT-001',
    vehiclePlate: 'TN-38-AA-1234',
    scheduleDay: 'Monday & Thursday',
    dayOfWeek: [1, 4],
    timeSlot: '7:00 AM - 10:00 AM',
    color: '#2E7D32',
    icon: 'trash-can',
    center: { latitude: 11.0244, longitude: 77.0028 },
    streets: [
      {
        stopNumber: 1,
        name: 'PSG Tech College Road',
        address: 'PSG Tech College Road, Peelamedu',
        landmark: 'Near PSG Tech Entrance Gate',
        latitude: 11.0244,
        longitude: 77.0028,
        binType: 'General & Organic',
        housesCount: 45,
      },
      {
        stopNumber: 2,
        name: 'Peelamedu Colony 1st Street',
        address: 'Peelamedu Colony 1st Street',
        landmark: 'Entry corner — residential houses',
        latitude: 11.0217,
        longitude: 77.0031,
        binType: 'Residential Dry & Wet',
        housesCount: 38,
      },
      {
        stopNumber: 3,
        name: 'Peelamedu Colony 2nd Street',
        address: 'Peelamedu Colony 2nd Street',
        landmark: 'Opposite Community Hall',
        latitude: 11.0225,
        longitude: 77.0039,
        binType: 'Residential Waste',
        housesCount: 42,
      },
      {
        stopNumber: 4,
        name: 'Peelamedu Colony 3rd Street',
        address: 'Peelamedu Colony 3rd Street',
        landmark: 'Row houses & apartment blocks',
        latitude: 11.0234,
        longitude: 77.0047,
        binType: 'Residential & Organic',
        housesCount: 35,
      },
      {
        stopNumber: 5,
        name: 'Peelamedu Colony 4th Street',
        address: 'Peelamedu Colony 4th Street',
        landmark: 'Near Children Park',
        latitude: 11.0242,
        longitude: 77.0055,
        binType: 'Residential Waste',
        housesCount: 30,
      },
      {
        stopNumber: 6,
        name: 'Peelamedu Cross Road',
        address: 'Peelamedu Cross Road Connector',
        landmark: 'Cross connector — shops & corner residences',
        latitude: 11.0259,
        longitude: 77.0048,
        binType: 'Commercial & Mixed',
        housesCount: 28,
      },
    ],
  },
  {
    id: 'peelamedu-hope-college',
    name: 'Peelamedu – Hope College Zone',
    shortName: 'Hope College Zone',
    area: 'Peelamedu',
    driverEmail: 'selvam.k@cleanconnect.gov.in',
    driverName: 'Selvam K',
    vehicleId: 'JCB-001',
    vehiclePlate: 'TN-38-JC-4501',
    scheduleDay: 'Tuesday & Friday',
    dayOfWeek: [2, 5],
    timeSlot: '8:00 AM - 11:00 AM',
    color: '#1565C0',
    icon: 'recycle',
    center: { latitude: 11.0250, longitude: 77.0100 },
    streets: [
      {
        stopNumber: 1,
        name: 'Hope College Junction Road',
        address: 'Hope College Junction Service Road',
        landmark: 'Near Hope College Bus Shelter',
        latitude: 11.0250,
        longitude: 77.0100,
        binType: 'Dry Recyclables & General',
        housesCount: 32,
      },
      {
        stopNumber: 2,
        name: 'Selvampathy Nagar 1st Street',
        address: 'Selvampathy Nagar 1st Street, Peelamedu',
        landmark: 'Entry arch of Selvampathy Nagar',
        latitude: 11.0248,
        longitude: 77.0108,
        binType: 'Residential Waste',
        housesCount: 36,
      },
      {
        stopNumber: 3,
        name: 'Selvampathy Nagar 2nd Street',
        address: 'Selvampathy Nagar 2nd Street, Peelamedu',
        landmark: 'Residential row houses both sides',
        latitude: 11.0256,
        longitude: 77.0117,
        binType: 'Residential Waste',
        housesCount: 40,
      },
      {
        stopNumber: 4,
        name: 'Selvampathy Nagar 3rd Street',
        address: 'Selvampathy Nagar 3rd Street, Peelamedu',
        landmark: 'Apartment complex & private homes',
        latitude: 11.0264,
        longitude: 77.0126,
        binType: 'Residential & Organic',
        housesCount: 34,
      },
      {
        stopNumber: 5,
        name: 'Pudur 2nd Street',
        address: 'Pudur 2nd Street, Peelamedu',
        landmark: 'Near Pudur Vinayagar Temple',
        latitude: 11.0268,
        longitude: 77.0055,
        binType: 'Residential Waste',
        housesCount: 48,
      },
      {
        stopNumber: 6,
        name: 'Pudur Main Road Service Lane',
        address: 'Pudur Main Road Service Lane',
        landmark: 'Shops & back residential apartments',
        latitude: 11.0272,
        longitude: 77.0112,
        binType: 'Commercial & Mixed',
        housesCount: 25,
      },
    ],
  },
  {
    id: 'peelamedu-avinashi-road',
    name: 'Peelamedu – Avinashi Road Zone',
    shortName: 'Avinashi Road Zone',
    area: 'Peelamedu',
    driverEmail: 'praveen.k@cleanconnect.gov.in',
    driverName: 'Praveen Kumar',
    vehicleId: 'ML-001',
    vehiclePlate: 'TN-38-ML-8820',
    scheduleDay: 'Wednesday & Saturday',
    dayOfWeek: [3, 6],
    timeSlot: '7:30 AM - 10:30 AM',
    color: '#E65100',
    icon: 'leaf',
    center: { latitude: 11.0255, longitude: 77.0098 },
    streets: [
      {
        stopNumber: 1,
        name: 'Avinashi Road Commercial Corridor',
        address: 'Avinashi Road Peelamedu Corridor',
        landmark: 'Main Highway Service Road — commercial bins',
        latitude: 11.0210,
        longitude: 77.0120,
        binType: 'Commercial Waste',
        housesCount: 20,
      },
      {
        stopNumber: 2,
        name: 'Fun Republic Mall Service Road',
        address: 'Fun Republic Mall Back Service Road',
        landmark: 'Behind Fun Republic Mall Entrance',
        latitude: 11.0255,
        longitude: 77.0098,
        binType: 'Bulk Commercial Waste',
        housesCount: 15,
      },
      {
        stopNumber: 3,
        name: 'GR Damodaran Road',
        address: 'GR Damodaran Road, Peelamedu',
        landmark: 'Near GRD Academy Bus Bay',
        latitude: 11.0280,
        longitude: 77.0142,
        binType: 'Residential & Academic',
        housesCount: 38,
      },
      {
        stopNumber: 4,
        name: 'Tidel Park IT Corridor Road',
        address: 'Tidel Park IT Corridor Road',
        landmark: 'Near Tidel Park Main Gate',
        latitude: 11.0298,
        longitude: 77.0264,
        binType: 'IT Office & Commercial',
        housesCount: 22,
      },
      {
        stopNumber: 5,
        name: 'Aerodrome Road',
        address: 'Aerodrome Road, Peelamedu',
        landmark: 'Residential layout near airport approach',
        latitude: 11.0285,
        longitude: 77.0220,
        binType: 'Residential Waste',
        housesCount: 44,
      },
      {
        stopNumber: 6,
        name: 'Neelikonampalayam 1st Street',
        address: 'Neelikonampalayam 1st Street, Peelamedu',
        landmark: 'Entry of residential colony',
        latitude: 11.0302,
        longitude: 77.0164,
        binType: 'Residential Waste',
        housesCount: 36,
      },
    ],
  },
];

// Helper to find zone by street name
export function getZoneByStreet(streetName) {
  if (!streetName) return PEELAMEDU_ZONES[0];
  const query = streetName.toLowerCase().trim();
  for (const zone of PEELAMEDU_ZONES) {
    if (zone.streets.some(s => s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase()))) {
      return zone;
    }
  }
  return PEELAMEDU_ZONES[0];
}

// Helper to find zone by driver info
export function getZoneByDriver(driverInfo) {
  const zoneStr = (driverInfo?.zone || '').toLowerCase();
  const email = (driverInfo?.email || '').toLowerCase();
  const vehicleId = driverInfo?.vehicleId || '';

  if (zoneStr.includes('psg') || zoneStr.includes('zone a') || email.includes('murugan') || vehicleId === 'GCT-001') {
    return PEELAMEDU_ZONES[0];
  }
  if (zoneStr.includes('hope') || zoneStr.includes('pudur') || zoneStr.includes('zone b') || email.includes('selvam') || vehicleId === 'JCB-001') {
    return PEELAMEDU_ZONES[1];
  }
  if (zoneStr.includes('avinashi') || zoneStr.includes('tidel') || zoneStr.includes('zone c') || email.includes('praveen') || vehicleId === 'ML-001') {
    return PEELAMEDU_ZONES[2];
  }
  return PEELAMEDU_ZONES[0];
}
