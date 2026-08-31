import User from '../models/User.js';
import Citizen from '../models/Citizen.js';
import Driver from '../models/Driver.js';
import Complaint from '../models/Complaint.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [
      totalComplaints, openComplaints, resolvedComplaints, inProgressComplaints,
      totalCitizens, totalDrivers,
      activeRoutes, completedRoutes,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Citizen.countDocuments(),
      Driver.countDocuments(),
      Route.countDocuments({ date: today, status: 'active' }),
      Route.countDocuments({ date: today, status: 'completed' }),
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
