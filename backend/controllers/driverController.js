import Route from '../models/Route.js';
import VehicleLocation from '../models/VehicleLocation.js';

let _io = null;
export const setIo = (io) => { _io = io; };

// Helper to find or seed today's route for the driver
async function getOrCreateTodayRoute(driverId) {
  const today = new Date().toISOString().split('T')[0];
  let route = await Route.findOne({ driver: driverId, date: today });

  if (!route) {
    // Check if there is any route for today that can be claimed
    route = await Route.findOne({ date: today });
    if (route && !route.driver) {
      route.driver = driverId;
      await route.save();
    }
  }

  if (!route) {
    // Seed a real street-by-street sequential route through Peelamedu roads
    // Coordinates are placed ON actual roads so OSRM routing will snap correctly
    route = await Route.create({
      driver: driverId,
      vehicleId: 'GCT-001',
      date: today,
      status: 'pending',
      stops: [
        // Stop 1 – Avinashi Road (main arterial) near Gandhipuram flyover junction
        {
          stopNumber: 1,
          address: 'Avinashi Road, Peelamedu Flyover Junction',
          area: 'Peelamedu',
          landmark: 'Near Avinashi Road–Trichy Road flyover junction, roadside bin cluster',
          street: 'Avinashi Road',
          latitude: 11.0178,
          longitude: 76.9971,
          status: 'completed',
        },
        // Stop 2 – Avinashi Road continuing east, near Meenakshi Hospital Road junction
        {
          stopNumber: 2,
          address: 'Avinashi Road, near Meenakshi Hospital Junction',
          area: 'Peelamedu',
          landmark: 'Opposite Meenakshi Hospital signal, roadside dustbin point',
          street: 'Avinashi Road',
          latitude: 11.0199,
          longitude: 77.0018,
          status: 'completed',
        },
        // Stop 3 – Turning into Peelamedu Main Road from Avinashi Road
        {
          stopNumber: 3,
          address: 'Peelamedu Main Road Junction, Avinashi Road',
          area: 'Peelamedu',
          landmark: 'Peelamedu Main Road–Avinashi Road junction, community bin hub',
          street: 'Peelamedu Main Road',
          latitude: 11.0217,
          longitude: 77.0055,
          status: 'in_progress',
        },
        // Stop 4 – Along Peelamedu Main Road, near KG Hospital entrance
        {
          stopNumber: 4,
          address: 'KG Hospital Road, Peelamedu Main Road',
          area: 'Peelamedu',
          landmark: 'KG Hospital main entrance gate, hospital waste + residential bin',
          street: 'Peelamedu Main Road',
          latitude: 11.0234,
          longitude: 77.0072,
          status: 'pending',
        },
        // Stop 5 – PSG College Road (branching off Peelamedu Main Road)
        {
          stopNumber: 5,
          address: 'PSG College Road, Peelamedu',
          area: 'Peelamedu',
          landmark: 'PSG College Road T-junction, college-area bin point',
          street: 'PSG College Road',
          latitude: 11.0248,
          longitude: 77.0030,
          status: 'pending',
        },
        // Stop 6 – GR Damodaran Road (off PSG College Road)
        {
          stopNumber: 6,
          address: 'GR Damodaran Academy Road, Peelamedu',
          area: 'Peelamedu',
          landmark: 'Beside GRD School gate, school + residential cluster bin',
          street: 'GR Damodaran Road',
          latitude: 11.0269,
          longitude: 77.0054,
          status: 'pending',
        },
        // Stop 7 – Peelamedu Pudur residential road (looping back south)
        {
          stopNumber: 7,
          address: 'Pudur 2nd Cross Street, Peelamedu',
          area: 'Peelamedu',
          landmark: 'Pudur residential colony, 2nd Cross Street dustbin point',
          street: 'Pudur 2nd Cross Street',
          latitude: 11.0254,
          longitude: 77.0112,
          status: 'pending',
        },
        // Stop 8 – Fun Republic Mall service road (back to Avinashi Road corridor)
        {
          stopNumber: 8,
          address: 'Fun Republic Mall Service Lane, Avinashi Road',
          area: 'Peelamedu',
          landmark: 'Fun Republic Mall side service road, commercial bulk waste bin',
          street: 'Fun Republic Mall Service Lane',
          latitude: 11.0236,
          longitude: 77.0143,
          status: 'pending',
        },
        // Stop 9 – Tidel Park Road (IT corridor)
        {
          stopNumber: 9,
          address: 'Tidel Park Road, Avinashi Road',
          area: 'Peelamedu',
          landmark: 'Tidel Park IT road junction, office-area waste collection',
          street: 'Tidel Park Road',
          latitude: 11.0207,
          longitude: 77.0110,
          status: 'pending',
        },
        // Stop 10 – Texvalley Mall Road (end of Avinashi Road corridor run)
        {
          stopNumber: 10,
          address: 'Texvalley Mall Road, Avinashi Road',
          area: 'Peelamedu',
          landmark: 'Texvalley Shopping Complex service entry, end-of-route bulk bin',
          street: 'Texvalley Mall Road',
          latitude: 11.0196,
          longitude: 77.0223,
          status: 'pending',
        },
      ],
    });
  }

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
        vehicleId: route?.vehicleId || 'GCT-001',
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
    const vId = vehicleId || 'GCT-001';

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
