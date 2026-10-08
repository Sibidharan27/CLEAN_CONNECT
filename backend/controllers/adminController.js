import User from '../models/User.js';
import Citizen from '../models/Citizen.js';
import Driver from '../models/Driver.js';
import Complaint from '../models/Complaint.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import Vehicle from '../models/Vehicle.js';

// ── Seed default vehicles if none exist ───────────────────────────────────────
async function seedVehicles() {
  const count = await Vehicle.countDocuments();
  if (count > 0) return;

  await Vehicle.insertMany([
    { vehicleId: 'GCT-001', type: 'garbage_truck', plateNumber: 'TN-38-AB-1234', capacity: '5 Tonnes', status: 'active', currentArea: 'Peelamedu Main Road & PSG Area', fuelLevel: 82 },
    { vehicleId: 'GCT-002', type: 'garbage_truck', plateNumber: 'TN-38-CD-5678', capacity: '3 Tonnes', status: 'active', currentArea: 'Avinashi Road & Tidel Park Area', fuelLevel: 65 },
    { vehicleId: 'GCT-003', type: 'jcb',           plateNumber: 'TN-38-EF-9012', capacity: '2 cubic m', status: 'active', currentArea: 'Peelamedu Pudur Dump Site', fuelLevel: 70 },
    { vehicleId: 'GCT-004', type: 'mini_loader',    plateNumber: 'TN-38-GH-3456', capacity: '1.5 Tonnes', status: 'maintenance', currentArea: 'Peelamedu Narrow Streets', fuelLevel: 45 },
    { vehicleId: 'GCT-005', type: 'road_sweeper',   plateNumber: 'TN-38-IJ-7890', capacity: '—', status: 'active', currentArea: 'Avinashi Road Stretch', fuelLevel: 90 },
    { vehicleId: 'GCT-006', type: 'garbage_truck',  plateNumber: 'TN-38-KL-2345', capacity: '5 Tonnes', status: 'inactive', currentArea: 'KG Hospital & Surroundings', fuelLevel: 30 },
  ]);
  console.log('Vehicles seeded with Peelamedu fleet');
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    await seedVehicles();
    const today = new Date().toISOString().split('T')[0];
    const [
      totalComplaints, openComplaints, resolvedComplaints, inProgressComplaints,
      totalCitizens, totalDrivers,
      activeRoutes, completedRoutes,
      totalVehicles, activeVehicles, maintenanceVehicles,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Citizen.countDocuments(),
      Driver.countDocuments(),
      Route.countDocuments({ date: today, status: 'active' }),
      Route.countDocuments({ date: today, status: 'completed' }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'maintenance' }),
    ]);

    const resolutionRate = totalComplaints > 0
      ? Math.round((resolvedComplaints / totalComplaints) * 100)
      : 0;

    // Complaints by category
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Last 7 days complaint trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const trend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalComplaints, openComplaints, resolvedComplaints, inProgressComplaints,
      totalCitizens, totalDrivers,
      activeRoutes, completedRoutes,
      resolutionRate,
      byCategory,
      trend,
      totalVehicles, activeVehicles, maintenanceVehicles,
    });
  } catch (e) { next(e); }
}

// ── All Complaints (admin sees everything) ────────────────────────────────────
export async function getAllComplaints(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('citizen', 'name email phone')
        .populate('assignedDriver', 'name phone vehicleId')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Complaint.countDocuments(filter),
    ]);

    // Fallback: if any complaint.citizen failed to populate (e.g. legacy User collection), resolve it
    for (const c of complaints) {
      if (!c.citizen || !c.citizen.name) {
        const citizenId = c.citizen?._id || c.citizen;
        if (citizenId) {
          const userDoc = await User.findById(citizenId).select('name email phone');
          if (userDoc) c.citizen = userDoc;
        }
      }
    }

    res.json({ complaints, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { next(e); }
}

// ── Update Complaint (status + assign driver) ─────────────────────────────────
export async function updateComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const { status, assignedDriver, resolutionNote } = req.body;

    if (status && status !== complaint.status) {
      complaint.status = status;
      complaint.timeline.push({
        status,
        time: new Date(),
        note: resolutionNote || `Status updated to ${status} by admin`,
      });
    }
    if (assignedDriver !== undefined) complaint.assignedDriver = assignedDriver || null;
    await complaint.save();
    res.json(await complaint.populate(['citizen', 'assignedDriver']));
  } catch (e) { next(e); }
}

// ── All Drivers ───────────────────────────────────────────────────────────────
export async function getAllDrivers(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const drivers = await Driver.find().sort('name');
    // Get route info for each driver
    const routes = await Route.find({ date: today });
    const routeMap = {};
    routes.forEach(r => { routeMap[r.driver?.toString()] = r; });

    // Get vehicle assignment info for each driver
    const vehicles = await Vehicle.find({ assignedDriver: { $ne: null } });
    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v.assignedDriver?.toString()] = v; });

    const driverData = drivers.map(d => ({
      _id: d._id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      vehicleId: d.vehicleId,
      employeeId: d.employeeId,
      zone: d.zone,
      shift: d.shift,
      route: routeMap[d._id.toString()] || null,
      assignedVehicle: vehicleMap[d._id.toString()] || null,
    }));
    res.json(driverData);
  } catch (e) { next(e); }
}

// ── All Citizens ──────────────────────────────────────────────────────────────
export async function getAllCitizens(req, res, next) {
  try {
    const citizens = await Citizen.find().sort('name');
    res.json(citizens);
  } catch (e) { next(e); }
}

// ── All Routes (today) ────────────────────────────────────────────────────────
export async function getAllRoutes(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const routes = await Route.find({ date: today }).populate('driver', 'name vehicleId phone');
    res.json(routes);
  } catch (e) { next(e); }
}

// ── All Schedules ─────────────────────────────────────────────────────────────
export async function getAllSchedules(req, res, next) {
  try {
    const schedules = await Schedule.find().sort('dayOfWeek').populate('driver', 'name');
    res.json(schedules);
  } catch (e) { next(e); }
}

// ── Create Driver account (admin creates drivers) ─────────────────────────────
export async function createDriver(req, res, next) {
  try {
    const { name, email, password, phone, vehicleId, employeeId, zone, shift } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required' });
    const exists = await Driver.exists({ email: email.toLowerCase() }) || await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const driver = await Driver.create({ name, email, password, phone, vehicleId, employeeId, zone, shift });
    res.status(201).json(driver);
  } catch (e) { next(e); }
}

// ── Delete Complaint ──────────────────────────────────────────────────────────
export async function deleteComplaint(req, res, next) {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted' });
  } catch (e) { next(e); }
}

// ── Vehicle CRUD ──────────────────────────────────────────────────────────────

export async function getAllVehicles(req, res, next) {
  try {
    await seedVehicles();
    const vehicles = await Vehicle.find().populate('assignedDriver', 'name email phone').sort('vehicleId');
    res.json(vehicles);
  } catch (e) { next(e); }
}

export async function createVehicle(req, res, next) {
  try {
    const { vehicleId, type, plateNumber, capacity, currentArea, notes } = req.body;
    if (!vehicleId || !type || !plateNumber) {
      return res.status(400).json({ message: 'vehicleId, type, and plateNumber are required' });
    }
    const exists = await Vehicle.exists({ vehicleId });
    if (exists) return res.status(409).json({ message: 'Vehicle ID already exists' });
    const vehicle = await Vehicle.create({ vehicleId, type, plateNumber, capacity, currentArea, notes });
    res.status(201).json(vehicle);
  } catch (e) { next(e); }
}

export async function updateVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const { status, currentArea, fuelLevel, notes, assignedDriver } = req.body;
    if (status !== undefined) vehicle.status = status;
    if (currentArea !== undefined) vehicle.currentArea = currentArea;
    if (fuelLevel !== undefined) vehicle.fuelLevel = fuelLevel;
    if (notes !== undefined) vehicle.notes = notes;
    if (assignedDriver !== undefined) vehicle.assignedDriver = assignedDriver || null;

    await vehicle.save();
    res.json(await vehicle.populate('assignedDriver', 'name email phone'));
  } catch (e) { next(e); }
}

export async function deleteVehicle(req, res, next) {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted' });
  } catch (e) { next(e); }
}

// ── Reset today's routes (admin tool) ───────────────────────────────────────
export async function resetTodayRoutes(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await Route.deleteMany({ date: today });
    res.json({ message: `Deleted ${result.deletedCount} route(s) for ${today}. Each driver will get a fresh route on next login.`, deletedCount: result.deletedCount });
  } catch (e) { next(e); }
}

export async function getDriverComplaintStats(req, res, next) {
  try {
    let period = parseInt(req.query.period);
    const unit = req.query.unit === 'years' ? 'years' : 'months';
    if (!period || isNaN(period) || period <= 0) {
      if (req.query.months) {
        period = parseInt(req.query.months) || 1;
      } else {
        period = 1;
      }
    }

    const since = new Date();
    if (unit === 'years') {
      since.setFullYear(since.getFullYear() - period);
    } else {
      since.setMonth(since.getMonth() - period);
    }

    // Count complaints with assignedDriver completed within the time window
    // Matches complaints where status is 'resolved' or 'closed' and
    // either timeline has resolved/closed entry with time >= since or updatedAt >= since.
    const pipeline = [
      {
        $match: {
          assignedDriver: { $ne: null },
          status: { $in: ['resolved', 'closed'] },
          $or: [
            {
              timeline: {
                $elemMatch: {
                  status: { $in: ['resolved', 'closed'] },
                  time: { $gte: since },
                },
              },
            },
            {
              updatedAt: { $gte: since },
            },
          ],
        },
      },
      {
        $group: {
          _id: '$assignedDriver',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await Complaint.aggregate(pipeline);

    // Build a driverId → count map
    const countMap = {};
    results.forEach(r => {
      if (r._id) {
        countMap[r._id.toString()] = r.count;
      }
    });

    res.json({ countMap, since, period, unit });
  } catch (e) { next(e); }
}
