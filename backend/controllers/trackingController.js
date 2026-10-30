import VehicleLocation from '../models/VehicleLocation.js';
export async function updateLocation(req, res, next) { try { res.status(201).json(await VehicleLocation.create(req.body)); } catch (e) { next(e); } }
export async function latestLocation(req, res, next) {
  try {
    const { vehicleId } = req.params;
    let loc = null;
    if (vehicleId && vehicleId !== 'all') {
      loc = await VehicleLocation.findOne({ vehicleId }).sort('-recordedAt');
    }
    if (!loc) {
      loc = await VehicleLocation.findOne().sort('-recordedAt');
    }
    res.json(loc || null);
  } catch (e) {
    next(e);
  }
}
