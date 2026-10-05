import Route from '../models/Route.js';
import Driver from '../models/Driver.js';
import VehicleLocation from '../models/VehicleLocation.js';

let _io = null;
export const setIo = (io) => { _io = io; };

// ─── Zone-specific route stops per driver ─────────────────────────────────────
// Each zone is a tight residential neighborhood cluster (200-500m between streets)
// The truck goes street by street, collecting from every home on that street.
function getZoneStops(driverInfo) {
  const zone = (driverInfo.zone || '').toLowerCase();
  const vehicleId = driverInfo.vehicleId || 'GCT-001';

  // Zone A – Peelamedu residential pocket near PSG (GCT-001 / Murugan S)
  // Streets are 200-400m apart in a tight residential grid around Peelamedu colony
  if (zone.includes('zone a') || vehicleId === 'GCT-001') {
    return [
      { stopNumber: 1, address: 'Peelamedu Colony 1st Street', area: 'Zone A - Peelamedu', street: 'Peelamedu Colony 1st Street', landmark: 'Start of street — collect from all homes on right and left side', latitude: 11.0217, longitude: 77.0031, status: 'completed' },
      { stopNumber: 2, address: 'Peelamedu Colony 2nd Street', area: 'Zone A - Peelamedu', street: 'Peelamedu Colony 2nd Street', landmark: 'Second residential lane — full street collection both sides', latitude: 11.0225, longitude: 77.0039, status: 'completed' },
      { stopNumber: 3, address: 'Peelamedu Colony 3rd Street', area: 'Zone A - Peelamedu', street: 'Peelamedu Colony 3rd Street', landmark: 'Third lane — collect from flats and row houses', latitude: 11.0234, longitude: 77.0047, status: 'in_progress' },
      { stopNumber: 4, address: 'Peelamedu Colony 4th Street', area: 'Zone A - Peelamedu', street: 'Peelamedu Colony 4th Street', landmark: 'Fourth lane — mixed residential, ring bell at each gate', latitude: 11.0242, longitude: 77.0055, status: 'pending' },
      { stopNumber: 5, address: 'Peelamedu Colony 5th Street', area: 'Zone A - Peelamedu', street: 'Peelamedu Colony 5th Street', landmark: 'Fifth lane — collect from 35 houses, 2 apartment blocks', latitude: 11.0251, longitude: 77.0063, status: 'pending' },
      { stopNumber: 6, address: 'Peelamedu Cross Road', area: 'Zone A - Peelamedu', street: 'Peelamedu Cross Road', landmark: 'Cross-connecting road — collect from shops and corner houses', latitude: 11.0259, longitude: 77.0048, status: 'pending' },
    ];
  }

  // Zone B – Selvampathy Nagar residential pocket (JCB-001 / Selvam K)
  // Tight cluster of residential streets in Peelamedu Pudur area
  if (zone.includes('zone b') || vehicleId === 'JCB-001') {
    return [
      { stopNumber: 1, address: 'Selvampathy Nagar 1st Street', area: 'Zone B - Pudur', street: 'Selvampathy Nagar 1st Street', landmark: 'Entry of Selvampathy Nagar — collect from all homes', latitude: 11.0248, longitude: 77.0108, status: 'completed' },
      { stopNumber: 2, address: 'Selvampathy Nagar 2nd Street', area: 'Zone B - Pudur', street: 'Selvampathy Nagar 2nd Street', landmark: 'Row houses on both sides, 28 homes total', latitude: 11.0256, longitude: 77.0117, status: 'completed' },
      { stopNumber: 3, address: 'Selvampathy Nagar 3rd Street', area: 'Zone B - Pudur', street: 'Selvampathy Nagar 3rd Street', landmark: 'Longer lane, includes one small apartment complex', latitude: 11.0264, longitude: 77.0126, status: 'in_progress' },
      { stopNumber: 4, address: 'Pudur Main Road Service Lane', area: 'Zone B - Pudur', street: 'Pudur Main Road Service Lane', landmark: 'Back service lane of Pudur Main Rd, ground-floor shops + flats above', latitude: 11.0272, longitude: 77.0112, status: 'pending' },
      { stopNumber: 5, address: 'Pudur Cross Street', area: 'Zone B - Pudur', street: 'Pudur Cross Street', landmark: 'Short cross lane connecting 2nd and 3rd streets', latitude: 11.0260, longitude: 77.0100, status: 'pending' },
    ];
  }

  // Zone C – Neelikonampalayam residential grid (ML-001 / Praveen Kumar)
  // Parallel residential streets in the Neelambur / Avinashi Rd corridor
  if (zone.includes('zone c') || vehicleId === 'ML-001') {
    return [
      { stopNumber: 1, address: 'Neelikonampalayam 1st Street', area: 'Zone C - Neelambur', street: 'Neelikonampalayam 1st Street', landmark: 'Entry point — 30 individual homes both sides', latitude: 11.0302, longitude: 77.0164, status: 'completed' },
      { stopNumber: 2, address: 'Neelikonampalayam 2nd Street', area: 'Zone C - Neelambur', street: 'Neelikonampalayam 2nd Street', landmark: 'Mix of houses and 2 small schools', latitude: 11.0311, longitude: 77.0173, status: 'completed' },
      { stopNumber: 3, address: 'Neelikonampalayam 3rd Street', area: 'Zone C - Neelambur', street: 'Neelikonampalayam 3rd Street', landmark: 'Fully residential, narrow lane — walk with handcart if needed', latitude: 11.0320, longitude: 77.0182, status: 'in_progress' },
      { stopNumber: 4, address: 'Neelikonampalayam 4th Street', area: 'Zone C - Neelambur', street: 'Neelikonampalayam 4th Street', landmark: '4th lane — 22 houses + corner kiosk', latitude: 11.0329, longitude: 77.0191, status: 'pending' },
      { stopNumber: 5, address: 'Neelambur Main Road Service Lane', area: 'Zone C - Neelambur', street: 'Neelambur Main Road Service Lane', landmark: 'Side service road — collect from shops and roadside residences', latitude: 11.0315, longitude: 77.0155, status: 'pending' },
      { stopNumber: 6, address: 'Neelambur Colony Cross Street', area: 'Zone C - Neelambur', street: 'Neelambur Colony Cross Street', landmark: 'Cross lane — end-of-zone collection before returning to depot', latitude: 11.0308, longitude: 77.0148, status: 'pending' },
    ];
  }

  // Zone D – Ganapathy residential grid (RS-001 / Muthu Raj)
  // Tight cluster of streets in Ganapathy / Saravanampatti residential area
  if (zone.includes('zone d') || vehicleId === 'RS-001') {
    return [
      { stopNumber: 1, address: 'Ganapathy Nagar 1st Street', area: 'Zone D - Ganapathy', street: 'Ganapathy Nagar 1st Street', landmark: 'First street — ring bell, wait 2 minutes per house', latitude: 11.0362, longitude: 76.9988, status: 'completed' },
      { stopNumber: 2, address: 'Ganapathy Nagar 2nd Street', area: 'Zone D - Ganapathy', street: 'Ganapathy Nagar 2nd Street', landmark: 'Second lane — 25 homes, 1 temple at end of street', latitude: 11.0370, longitude: 76.9998, status: 'in_progress' },
      { stopNumber: 3, address: 'Ganapathy Nagar 3rd Street', area: 'Zone D - Ganapathy', street: 'Ganapathy Nagar 3rd Street', landmark: 'Third lane — new houses, some still under construction', latitude: 11.0379, longitude: 77.0008, status: 'pending' },
      { stopNumber: 4, address: 'Ganapathy Main Road Service Lane', area: 'Zone D - Ganapathy', street: 'Ganapathy Main Road Side Lane', landmark: 'Service lane beside main road — shops and residential mixed', latitude: 11.0368, longitude: 77.0018, status: 'pending' },
      { stopNumber: 5, address: 'Ganapathy Cross Street', area: 'Zone D - Ganapathy', street: 'Ganapathy Cross Street', landmark: 'Short connector — collect from 15 homes before turning back', latitude: 11.0358, longitude: 77.0010, status: 'pending' },
    ];
  }

  // Default fallback – generic Peelamedu residential streets
  return [
    { stopNumber: 1, address: 'Peelamedu Layout 1st Street', area: 'Peelamedu', street: 'Layout 1st Street', landmark: 'Entry of layout — collect from all homes', latitude: 11.0230, longitude: 77.0065, status: 'completed' },
    { stopNumber: 2, address: 'Peelamedu Layout 2nd Street', area: 'Peelamedu', street: 'Layout 2nd Street', landmark: 'Second lane, 20 homes', latitude: 11.0238, longitude: 77.0073, status: 'in_progress' },
    { stopNumber: 3, address: 'Peelamedu Layout 3rd Street', area: 'Peelamedu', street: 'Layout 3rd Street', landmark: 'Third lane, end of today\'s route', latitude: 11.0246, longitude: 77.0081, status: 'pending' },
    { stopNumber: 4, address: 'Peelamedu Layout Cross Road', area: 'Peelamedu', street: 'Layout Cross Road', landmark: 'Cross connector — pick up remaining bins', latitude: 11.0241, longitude: 77.0059, status: 'pending' },
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
