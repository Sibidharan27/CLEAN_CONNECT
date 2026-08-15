import VehicleLocation from '../models/VehicleLocation.js';
export async function updateLocation(req, res, next) { try { res.status(201).json(await VehicleLocation.create(req.body)); } catch (e) { next(e); } }
export async function latestLocation(req, res, next) { try { res.json(await VehicleLocation.findOne({ vehicleId: req.params.vehicleId }).sort('-recordedAt')); } catch (e) { next(e); } }
