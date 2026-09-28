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
          { stopNumber: 1, address: 'PSG College Main Gate, Peelamedu',         area: 'Peelamedu', landmark: 'Near PSG Tech Entrance',         latitude: 11.0244, longitude: 77.0028, status: 'completed' },
          { stopNumber: 2, address: 'Tidel Park Junction, Avinashi Road',       area: 'Peelamedu', landmark: 'Opposite Tidel Park IT Hub',     latitude: 11.0206, longitude: 77.0109, status: 'pending' },
          { stopNumber: 3, address: 'Fun Republic Mall, Peelamedu',             area: 'Peelamedu', landmark: 'Near Fun Republic Entrance',      latitude: 11.0235, longitude: 77.0142, status: 'pending' },
          { stopNumber: 4, address: 'GR Damodaran Academy, Peelamedu',          area: 'Peelamedu', landmark: 'Beside GRD School Gate',          latitude: 11.0280, longitude: 77.0070, status: 'pending' },
          { stopNumber: 5, address: 'Peelamedu Pudur Bus Stop',                 area: 'Peelamedu', landmark: 'Main Road Bus Shelter',            latitude: 11.0260, longitude: 77.0185, status: 'pending' },
          { stopNumber: 6, address: 'KG Hospital, Peelamedu',                   area: 'Peelamedu', landmark: 'Near KG Hospital Main Entrance',  latitude: 11.0215, longitude: 77.0060, status: 'pending' },
          { stopNumber: 7, address: 'Texvalley Mall, Avinashi Road',            area: 'Peelamedu', landmark: 'Texvalley Shopping Complex',      latitude: 11.0195, longitude: 77.0222, status: 'pending' },
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
