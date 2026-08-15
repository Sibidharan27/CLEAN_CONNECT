import Route from '../models/Route.js';
import VehicleLocation from '../models/VehicleLocation.js';
import { createNotification } from './notificationController.js';

let _io = null;
export const setIo = (io) => { _io = io; };

// GET /api/driver/routes — today's assigned routes
export async function getDriverRoutes(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    let route = await Route.findOne({ driver: req.user.id, date: today });

    // Seed a demo route if none exists (for dev/testing)
    if (!route) {
      route = await Route.create({
        driver: req.user.id,
        vehicleId: 'GCT-001',
        date: today,
        stops: [
          { stopNumber: 1, address: '12, Rose Garden Street, Zone A', area: 'Central District', landmark: 'Near Central Park', latitude: 13.0827, longitude: 80.2707, status: 'completed' },
          { stopNumber: 2, address: '45, MG Road, Zone A', area: 'Central District', landmark: 'Opposite City Mall', latitude: 13.085, longitude: 80.272, status: 'pending' },
          { stopNumber: 3, address: '78, Anna Nagar 2nd Street, Zone A', area: 'North District', landmark: 'Near Anna Nagar Tower', latitude: 13.09, longitude: 80.275, status: 'pending' },
          { stopNumber: 4, address: '23, Velachery Main Road, Zone B', area: 'South District', landmark: 'Beside Reliance Fresh', latitude: 13.07, longitude: 80.265, status: 'pending' },
          { stopNumber: 5, address: '56, T Nagar, Zone B', area: 'West District', landmark: 'Pondy Bazaar Junction', latitude: 13.04, longitude: 80.23, status: 'pending' },
        ],
      });
    }

    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/routes/:routeId/stops/:stopId/complete
export async function completeStop(req, res, next) {
  try {
    const route = await Route.findOne({ _id: req.params.routeId, driver: req.user.id });
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const stop = route.stops.id(req.params.stopId);
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    stop.status = 'completed';
    stop.completedAt = new Date();

    const allDone = route.stops.every(s => s.status === 'completed');
    if (allDone) { route.status = 'completed'; route.completedAt = new Date(); }
    else if (route.status === 'pending') { route.status = 'active'; route.startedAt = new Date(); }

    await route.save();
    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/routes/:routeId/start
export async function startRoute(req, res, next) {
  try {
    const route = await Route.findOneAndUpdate(
      { _id: req.params.routeId, driver: req.user.id },
      { status: 'active', startedAt: new Date() },
      { new: true }
    );
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (e) { next(e); }
}

// POST /api/driver/location — broadcast GPS location
export async function updateDriverLocation(req, res, next) {
  try {
    const { latitude, longitude, vehicleId, heading, speed } = req.body;

    // Save to DB
    const loc = await VehicleLocation.create({
      vehicleId: vehicleId || 'GCT-001',
      latitude,
      longitude,
      heading,
      speed,
      recordedAt: new Date(),
    });

    // Broadcast via Socket.IO
    if (_io) {
      _io.to(`vehicle:${vehicleId || 'GCT-001'}`).emit('tracking:updated', {
        vehicleId: vehicleId || 'GCT-001',
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
        driverName: req.user.name,
      });
    }

    res.status(201).json(loc);
  } catch (e) { next(e); }
}

// GET /api/driver/stats
export async function getDriverStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const route = await Route.findOne({ driver: req.user.id, date: today });

    const completed = route ? route.stops.filter(s => s.status === 'completed').length : 0;
    const total = route ? route.stops.length : 0;

    res.json({
      completed,
      remaining: total - completed,
      totalStops: total,
      routeStatus: route?.status || 'pending',
      startedAt: route?.startedAt || null,
    });
  } catch (e) { next(e); }
}
