import mongoose from 'mongoose';
import Route from '../models/Route.js';
import Driver from '../models/Driver.js';
import VehicleLocation from '../models/VehicleLocation.js';

let _io = null;
export const setIo = (io) => { _io = io; };

import { PEELAMEDU_ZONES, getZoneByDriver } from '../utils/zonesData.js';

// ─── Zone-specific route stops per driver ─────────────────────────────────────
// Each zone is a compact neighborhood cluster of 5–6 nearby streets in Peelamedu.
// The driver collects street-by-street.
function getZoneStops(driverInfo) {
  const zone = getZoneByDriver(driverInfo);
  return {
    zoneName: zone.name,
    vehicleId: zone.vehicleId,
    stops: zone.streets.map((s, idx) => ({
      stopNumber: s.stopNumber || idx + 1,
      address: s.address,
      area: zone.name,
      street: s.name,
      landmark: s.landmark,
      binType: s.binType,
      housesCount: s.housesCount,
      latitude: s.latitude,
      longitude: s.longitude,
      status: idx === 0 ? 'in_progress' : 'pending',
    })),
  };
}

// Helper to find or seed today's route for the driver
async function getOrCreateTodayRoute(driverId) {
  const today = new Date().toISOString().split('T')[0];

  // Always look up THIS driver's specific route first
  let route = await Route.findOne({ driver: driverId, date: today });
  if (route) return route;

  // Fetch driver info to personalise the route
  const driverInfo = await Driver.findById(driverId).select('vehicleId zone name email').lean();
  const zoneConfig = getZoneStops(driverInfo || {});
  const vehicleId = driverInfo?.vehicleId || zoneConfig.vehicleId || 'GCT-001';

  route = await Route.create({
    driver: driverId,
    vehicleId,
    zoneName: zoneConfig.zoneName,
    area: 'Peelamedu',
    date: today,
    status: 'pending',
    stops: zoneConfig.stops,
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

// Haversine distance helper in metres
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/driver/routes/:routeId/stops/:stopId/complete
export async function completeStop(req, res, next) {
  try {
    let route = null;
    if (req.params.routeId && mongoose.Types.ObjectId.isValid(req.params.routeId)) {
      route = await Route.findById(req.params.routeId);
    }
    if (!route) {
      route = await getOrCreateTodayRoute(req.user.id);
    }
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const stop = route.stops.id(req.params.stopId) || route.stops.find(s => String(s._id) === String(req.params.stopId));
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    // Optional server-side proximity check if coordinates are provided
    const { latitude, longitude } = req.body || {};
    if (latitude && longitude && stop.latitude && stop.longitude) {
      const distance = getDistanceMeters(latitude, longitude, stop.latitude, stop.longitude);
      // Allow up to 100 meters on server to account for GPS accuracy / signal variance
      if (distance > 100) {
        return res.status(400).json({
          message: `Move closer to the collection area to mark this street complete. You are ${Math.round(distance)}m away.`,
          distance: Math.round(distance),
        });
      }
    }

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

    if (req.params.routeId && req.params.routeId !== 'today' && mongoose.Types.ObjectId.isValid(req.params.routeId)) {
      route = await Route.findById(req.params.routeId);
    }

    if (!route) {
      route = await getOrCreateTodayRoute(req.user.id);
    }

    if (route) {
      // If the route was already completed, reset the stops so a fresh collection run can start
      const allCompleted = route.stops && route.stops.length > 0 && route.stops.every(s => s.status === 'completed');
      if (route.status === 'completed' || allCompleted) {
        route.stops.forEach((s, idx) => {
          s.status = idx === 0 ? 'in_progress' : 'pending';
          s.completedAt = null;
        });
        route.completedAt = null;
      } else if (route.stops && route.stops.length > 0) {
        const hasInProgress = route.stops.some(s => s.status === 'in_progress');
        if (!hasInProgress) {
          const firstPending = route.stops.find(s => s.status === 'pending');
          if (firstPending) firstPending.status = 'in_progress';
        }
      }

      route.status = 'active';
      route.startedAt = new Date();
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

// POST /api/driver/routes/:routeId/stop — pause / stop the active route
export async function stopRoute(req, res, next) {
  try {
    let route = null;

    if (req.params.routeId && req.params.routeId !== 'today' && mongoose.Types.ObjectId.isValid(req.params.routeId)) {
      route = await Route.findOne({ _id: req.params.routeId, driver: req.user.id }) || await Route.findById(req.params.routeId);
    }

    if (!route) {
      const today = new Date().toISOString().split('T')[0];
      route = await Route.findOne({ driver: req.user.id, date: today });
    }

    if (!route) return res.status(404).json({ message: 'Route not found' });

    // Pause: revert active → pending so driver can resume later
    if (route.status === 'active') {
      route.status = 'pending';
      // Also revert any in_progress stops back to pending
      route.stops.forEach(s => {
        if (s.status === 'in_progress') s.status = 'pending';
      });
      await route.save();
    }

    if (_io) {
      _io.emit('route:stopped', {
        routeId: route._id,
        driverId: req.user.id,
        vehicleId: route.vehicleId || 'GCT-001',
        stoppedAt: new Date().toISOString(),
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
    const currentStop = route ? route.stops.find(s => s.status === 'in_progress') || route.stops.find(s => s.status === 'pending') : null;
    const currentStreet = currentStop ? currentStop.street : (completed === total && total > 0 ? 'Zone Collection Completed' : 'Not Started');

    res.json({
      completed,
      remaining: total - completed,
      totalStops: total,
      zoneName: route?.zoneName || 'Peelamedu – PSG Zone',
      currentStreet,
      routeStatus: route?.status || 'pending',
      startedAt: route?.startedAt || null,
      routeId: route?._id || null,
      vehicleId: route?.vehicleId || 'GCT-001',
    });
  } catch (e) { next(e); }
}
