import Route from '../models/Route.js';
import Driver from '../models/Driver.js';
import VehicleLocation from '../models/VehicleLocation.js';

let _io = null;
export const setIo = (io) => { _io = io; };

// ─── Zone-specific route stops per driver ─────────────────────────────────────
// Each driver gets different stops based on their zone/vehicleId so data is consistent
function getZoneStops(driverInfo) {
  const zone = (driverInfo.zone || '').toLowerCase();
  const vehicleId = driverInfo.vehicleId || 'GCT-001';

  // Zone A – Peelamedu PSG area (GCT-001 / Murugan S)
  if (zone.includes('zone a') || vehicleId === 'GCT-001') {
    return [
      { stopNumber: 1, address: 'Avinashi Road, Peelamedu Flyover Junction', area: 'Zone A - Peelamedu', street: 'Avinashi Road', landmark: 'Near Avinashi Road–Trichy Road flyover junction, roadside bin cluster', latitude: 11.0178, longitude: 76.9971, status: 'completed' },
      { stopNumber: 2, address: 'Avinashi Road, near Meenakshi Hospital Junction', area: 'Zone A - Peelamedu', street: 'Avinashi Road', landmark: 'Opposite Meenakshi Hospital signal, roadside dustbin point', latitude: 11.0199, longitude: 77.0018, status: 'completed' },
      { stopNumber: 3, address: 'Peelamedu Main Road Junction, Avinashi Road', area: 'Zone A - Peelamedu', street: 'Peelamedu Main Road', landmark: 'Peelamedu Main Road–Avinashi Road junction, community bin hub', latitude: 11.0217, longitude: 77.0055, status: 'in_progress' },
      { stopNumber: 4, address: 'KG Hospital Road, Peelamedu Main Road', area: 'Zone A - Peelamedu', street: 'Peelamedu Main Road', landmark: 'KG Hospital main entrance gate, hospital waste + residential bin', latitude: 11.0234, longitude: 77.0072, status: 'pending' },
      { stopNumber: 5, address: 'PSG College Road, Peelamedu', area: 'Zone A - Peelamedu', street: 'PSG College Road', landmark: 'PSG College Road T-junction, college-area bin point', latitude: 11.0248, longitude: 77.0030, status: 'pending' },
      { stopNumber: 6, address: 'GR Damodaran Academy Road, Peelamedu', area: 'Zone A - Peelamedu', street: 'GR Damodaran Road', landmark: 'Beside GRD School gate, school + residential cluster bin', latitude: 11.0269, longitude: 77.0054, status: 'pending' },
      { stopNumber: 7, address: 'Pudur 2nd Cross Street, Peelamedu', area: 'Zone A - Peelamedu', street: 'Pudur 2nd Cross Street', landmark: 'Pudur residential colony, 2nd Cross Street dustbin point', latitude: 11.0254, longitude: 77.0112, status: 'pending' },
      { stopNumber: 8, address: 'Fun Republic Mall Service Lane, Avinashi Road', area: 'Zone A - Peelamedu', street: 'Fun Republic Mall Service Lane', landmark: 'Fun Republic Mall side service road, commercial bulk waste bin', latitude: 11.0236, longitude: 77.0143, status: 'pending' },
      { stopNumber: 9, address: 'Tidel Park Road, Avinashi Road', area: 'Zone A - Peelamedu', street: 'Tidel Park Road', landmark: 'Tidel Park IT road junction, office-area waste collection', latitude: 11.0207, longitude: 77.0110, status: 'pending' },
      { stopNumber: 10, address: 'Texvalley Mall Road, Avinashi Road', area: 'Zone A - Peelamedu', street: 'Texvalley Mall Road', landmark: 'Texvalley Shopping Complex service entry, end-of-route bulk bin', latitude: 11.0196, longitude: 77.0223, status: 'pending' },
    ];
  }

  // Zone B – Peelamedu Avinashi Road / JCB area (JCB-001 / Selvam K)
  if (zone.includes('zone b') || vehicleId === 'JCB-001') {
    return [
      { stopNumber: 1, address: 'Avinashi Road, near KMCH Hospital', area: 'Zone B - Avinashi Rd', street: 'Avinashi Road', landmark: 'KMCH Hospital Gate, large waste accumulation point', latitude: 11.0163, longitude: 77.0003, status: 'completed' },
      { stopNumber: 2, address: 'Avinashi Road, near Brookefields Mall', area: 'Zone B - Avinashi Rd', street: 'Avinashi Road', landmark: 'Brookefields Mall back service road, commercial bulk bin', latitude: 11.0150, longitude: 77.0074, status: 'completed' },
      { stopNumber: 3, address: 'Avinashi Road, Dairy Circle Junction', area: 'Zone B - Avinashi Rd', street: 'Avinashi Road', landmark: 'Dairy Circle roundabout, roadside community bin cluster', latitude: 11.0135, longitude: 77.0141, status: 'in_progress' },
      { stopNumber: 4, address: 'Nehru Nagar 1st Street, Peelamedu', area: 'Zone B - Avinashi Rd', street: 'Nehru Nagar 1st Street', landmark: 'Nehru Nagar residential colony bin point', latitude: 11.0122, longitude: 77.0205, status: 'pending' },
      { stopNumber: 5, address: 'Lakshmi Mills Road, Peelamedu', area: 'Zone B - Avinashi Rd', street: 'Lakshmi Mills Road', landmark: 'Near Lakshmi Mills compound wall, industrial waste area', latitude: 11.0108, longitude: 77.0235, status: 'pending' },
      { stopNumber: 6, address: 'Avinashi Road, Kuniyamuthur Junction', area: 'Zone B - Avinashi Rd', street: 'Avinashi Road', landmark: 'Kuniyamuthur bypass junction, heavy-vehicle bin cluster', latitude: 11.0089, longitude: 77.0314, status: 'pending' },
      { stopNumber: 7, address: 'Saibaba Colony Bus Stop', area: 'Zone B - Avinashi Rd', street: 'Saibaba Colony Road', landmark: 'Opposite Saibaba Colony bus stop, residential bin', latitude: 11.0074, longitude: 77.0349, status: 'pending' },
      { stopNumber: 8, address: 'Sowripalayam Road, near Peelamedu Agri Market', area: 'Zone B - Avinashi Rd', street: 'Sowripalayam Road', landmark: 'Old Agri Market entry, bulk organic waste bin', latitude: 11.0060, longitude: 77.0391, status: 'pending' },
    ];
  }

  // Zone C – Tidel Park IT corridor (ML-001 / Praveen Kumar)
  if (zone.includes('zone c') || vehicleId === 'ML-001') {
    return [
      { stopNumber: 1, address: 'Tidel Park Phase 1 Main Gate, Coimbatore', area: 'Zone C - IT Corridor', street: 'Tidel Park Road', landmark: 'Tidel Park Phase 1 main entrance, IT office waste collection', latitude: 11.0218, longitude: 77.0098, status: 'completed' },
      { stopNumber: 2, address: 'Tidel Park Phase 2 Road, Coimbatore', area: 'Zone C - IT Corridor', street: 'Tidel Park Road', landmark: 'Tidel Park Phase 2 side gate, cafeteria waste bins', latitude: 11.0228, longitude: 77.0128, status: 'completed' },
      { stopNumber: 3, address: 'Aerodrome Road, near Airport Gate', area: 'Zone C - IT Corridor', street: 'Aerodrome Road', landmark: 'Civil Airport Road junction, nearby residential colony bin', latitude: 11.0242, longitude: 77.0163, status: 'in_progress' },
      { stopNumber: 4, address: 'Sathy Road, near Gandhipuram Bus Stand', area: 'Zone C - IT Corridor', street: 'Sathy Road', landmark: 'Near Gandhipuram bus stand junction, public dustbin cluster', latitude: 11.0258, longitude: 77.0198, status: 'pending' },
      { stopNumber: 5, address: 'Race Course Road, Coimbatore', area: 'Zone C - IT Corridor', street: 'Race Course Road', landmark: 'Race Course Road commercial waste pickup point', latitude: 11.0275, longitude: 77.0231, status: 'pending' },
      { stopNumber: 6, address: 'Trichy Road, near Ukkadam Bus Stand', area: 'Zone C - IT Corridor', street: 'Trichy Road', landmark: 'Ukkadam bus stand area, heavy pedestrian waste zone', latitude: 11.0291, longitude: 77.0267, status: 'pending' },
      { stopNumber: 7, address: 'DB Road, RS Puram Market', area: 'Zone C - IT Corridor', street: 'DB Road', landmark: 'RS Puram market exit, wet market waste collection', latitude: 11.0310, longitude: 77.0296, status: 'pending' },
      { stopNumber: 8, address: 'Cross Cut Road, near KR Sweets', area: 'Zone C - IT Corridor', street: 'Cross Cut Road', landmark: 'Cross Cut road – DB road junction, residential cluster bin', latitude: 11.0328, longitude: 77.0318, status: 'pending' },
    ];
  }

  // Zone D / Night shift – Avinashi Road night sweep (RS-001 / Muthu Raj)
  if (zone.includes('zone d') || vehicleId === 'RS-001') {
    return [
      { stopNumber: 1, address: 'Ganapathy Main Road, Coimbatore', area: 'Zone D - Night Sweep', street: 'Ganapathy Main Road', landmark: 'Ganapathy town centre dustbin hub', latitude: 11.0362, longitude: 76.9988, status: 'completed' },
      { stopNumber: 2, address: 'Vadavalli Main Road, Coimbatore', area: 'Zone D - Night Sweep', street: 'Vadavalli Main Road', landmark: 'Vadavalli junction roadside bins', latitude: 11.0339, longitude: 76.9909, status: 'in_progress' },
      { stopNumber: 3, address: 'Saravanampatty Road, Coimbatore', area: 'Zone D - Night Sweep', street: 'Saravanampatty Road', landmark: 'Near Saravanampatty signal, residential bin cluster', latitude: 11.0318, longitude: 76.9851, status: 'pending' },
      { stopNumber: 4, address: 'Palladam Road, near SIPCOT Gate', area: 'Zone D - Night Sweep', street: 'Palladam Road', landmark: 'SIPCOT Industrial estate entry, industrial waste zone', latitude: 11.0297, longitude: 76.9793, status: 'pending' },
      { stopNumber: 5, address: 'Kalapatti Main Road', area: 'Zone D - Night Sweep', street: 'Kalapatti Road', landmark: 'Kalapatti road junction, commercial bin cluster', latitude: 11.0278, longitude: 76.9737, status: 'pending' },
      { stopNumber: 6, address: 'Vilankurichi Road, near Water Tank', area: 'Zone D - Night Sweep', street: 'Vilankurichi Road', landmark: 'Old water tank junction, residential waste bin', latitude: 11.0260, longitude: 76.9668, status: 'pending' },
    ];
  }

  // Default fallback – generic Coimbatore stops
  return [
    { stopNumber: 1, address: 'Town Hall Road, Coimbatore', area: 'Coimbatore City', street: 'Town Hall Road', landmark: 'Town Hall junction dustbin cluster', latitude: 11.0026, longitude: 76.9660, status: 'completed' },
    { stopNumber: 2, address: 'Big Bazaar Street, Coimbatore', area: 'Coimbatore City', street: 'Big Bazaar Street', landmark: 'Big Bazaar market waste pickup', latitude: 11.0037, longitude: 76.9685, status: 'in_progress' },
    { stopNumber: 3, address: 'Oppanakara Street, Coimbatore', area: 'Coimbatore City', street: 'Oppanakara Street', landmark: 'Oppanakara Street market bin cluster', latitude: 11.0049, longitude: 76.9710, status: 'pending' },
    { stopNumber: 4, address: 'Cross Cut Road, Gandhipuram', area: 'Coimbatore City', street: 'Cross Cut Road', landmark: 'Near Gandhipuram bus stand, public bins', latitude: 11.0069, longitude: 76.9738, status: 'pending' },
    { stopNumber: 5, address: 'Railway Station Road, Coimbatore', area: 'Coimbatore City', street: 'Railway Station Road', landmark: 'Coimbatore Railway Station south entrance, platform waste', latitude: 11.0046, longitude: 76.9595, status: 'pending' },
  ];
}

// Helper to find or seed today's route for the driver
async function getOrCreateTodayRoute(driverId) {
  const today = new Date().toISOString().split('T')[0];

  // Always look up THIS driver's specific route first
  let route = await Route.findOne({ driver: driverId, date: today });
  if (route) return route;

  // Fetch driver info to personalise the route
  const driverInfo = await Driver.findById(driverId).select('vehicleId zone name').lean();
  const vehicleId = driverInfo?.vehicleId || 'GCT-001';
  const stops = getZoneStops(driverInfo || {});

  route = await Route.create({
    driver: driverId,
    vehicleId,
    date: today,
    status: 'pending',
    stops,
  });

  return route;
}

// GET /api/driver/routes — today's assigned routes
export async function getDriverRoutes(req, res, next) {
  try {
    const route = await getOrCreateTodayRoute(req.user.id);
    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/routes/:routeId/stops/:stopId/complete
export async function completeStop(req, res, next) {
  try {
    let route = await Route.findOne({ _id: req.params.routeId });
    if (!route) {
      route = await getOrCreateTodayRoute(req.user.id);
    }
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const stop = route.stops.id(req.params.stopId) || route.stops.find(s => String(s._id) === String(req.params.stopId));
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    stop.status = 'completed';
    stop.completedAt = new Date();

    const allDone = route.stops.every(s => s.status === 'completed');
    if (allDone) {
      route.status = 'completed';
      route.completedAt = new Date();
    } else if (route.status === 'pending') {
      route.status = 'active';
      route.startedAt = route.startedAt || new Date();
    }

    // Set next pending stop to in_progress
    const nextPending = route.stops.find(s => s.status === 'pending');
    if (nextPending) {
      nextPending.status = 'in_progress';
    }

    await route.save();

    if (_io) {
      _io.emit('route:stop_completed', {
        routeId: route._id,
        stopId: stop._id,
        stopNumber: stop.stopNumber,
        completedAt: stop.completedAt,
      });
    }

    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/routes/:routeId/start
export async function startRoute(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let route = null;

    if (req.params.routeId && req.params.routeId !== 'today') {
      route = await Route.findById(req.params.routeId);
    }

    if (!route) {
      route = await getOrCreateTodayRoute(req.user.id);
    }

    if (route) {
      route.status = 'active';
      route.startedAt = new Date();
      if (route.stops && route.stops.length > 0 && route.stops[0].status === 'pending') {
        route.stops[0].status = 'in_progress';
      }
      await route.save();
    }

    if (_io) {
      _io.emit('route:started', {
        routeId: route?._id,
        driverId: req.user.id,
        vehicleId: route?.vehicleId || req.user?.vehicleId || 'GCT-001',
        startedAt: route?.startedAt,
      });
    }

    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/location — broadcast GPS location
export async function updateDriverLocation(req, res, next) {
  try {
    const { latitude, longitude, vehicleId, heading, speed } = req.body;
    // Prefer vehicleId from request body, then from driver's profile, then default
    const vId = vehicleId || req.user?.vehicleId || 'GCT-001';

    // Save to DB
    const loc = await VehicleLocation.create({
      vehicleId: vId,
      latitude,
      longitude,
      heading: heading || 0,
      speed: speed || 0,
      recordedAt: new Date(),
    });

    // Broadcast via Socket.IO to vehicle channel and globally
    if (_io) {
      const payload = {
        vehicleId: vId,
        latitude,
        longitude,
        heading: heading || 0,
        speed: speed || 0,
        timestamp: new Date().toISOString(),
        driverName: req.user?.name || 'Driver',
      };
      _io.to(`vehicle:${vId}`).emit('tracking:updated', payload);
      _io.emit('tracking:updated', payload);
    }

    res.status(201).json(loc);
  } catch (e) { next(e); }
}

// GET /api/driver/stats
export async function getDriverStats(req, res, next) {
  try {
    const route = await getOrCreateTodayRoute(req.user.id);

    const completed = route ? route.stops.filter(s => s.status === 'completed').length : 0;
    const total = route ? route.stops.length : 0;

    res.json({
      completed,
      remaining: total - completed,
      totalStops: total,
      routeStatus: route?.status || 'pending',
      startedAt: route?.startedAt || null,
      routeId: route?._id || null,
    });
  } catch (e) { next(e); }
}
