import Schedule from '../models/Schedule.js';

// Seed default schedules if none exist
async function seedSchedules() {
  const count = await Schedule.countDocuments();
  if (count > 0) return;

  const now = new Date();
  await Schedule.insertMany([
    { area: 'Zone A - Central District', zone: 'Zone A', type: 'General Waste', dayOfWeek: [1, 4], timeSlot: '7:00 AM - 10:00 AM', vehicleId: 'GCT-001', color: '#2E7D32', icon: 'trash-can' },
    { area: 'Zone A - Central District', zone: 'Zone A', type: 'Recyclables', dayOfWeek: [3], timeSlot: '8:00 AM - 11:00 AM', vehicleId: 'GCT-002', color: '#1565C0', icon: 'recycle' },
    { area: 'Zone A - Central District', zone: 'Zone A', type: 'Organic Waste', dayOfWeek: [6], timeSlot: '9:00 AM - 12:00 PM', vehicleId: 'GCT-003', color: '#4CAF50', icon: 'leaf' },
    { area: 'Zone B - Lake District', zone: 'Zone B', type: 'General Waste', dayOfWeek: [2, 5], timeSlot: '7:00 AM - 10:00 AM', vehicleId: 'GCT-004', color: '#2E7D32', icon: 'trash-can' },
  ]);
  console.log('Schedules seeded');
}

export async function listSchedules(req, res, next) {
  try {
    await seedSchedules();
    const { zone, area } = req.query;
    const filter = { isActive: true };
    if (zone) filter.zone = zone;
    if (area) filter.area = { $regex: area, $options: 'i' };
    const schedules = await Schedule.find(filter).populate('driver', 'name phone');
    res.json(schedules);
  } catch (e) { next(e); }
}

export async function getUpcomingCollections(req, res, next) {
  try {
    await seedSchedules();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedules = await Schedule.find({ isActive: true }).populate('driver', 'name phone');
    const today = new Date().getDay();

    const result = schedules.map(s => {
      // Find next occurrence
      const nextDays = s.dayOfWeek
        .map(d => ({ day: d, diff: (d - today + 7) % 7 }))
        .sort((a, b) => a.diff - b.diff);

      const next = nextDays[0];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + next.diff);

      return {
        _id: s._id,
        area: s.area,
        zone: s.zone,
        type: s.type,
        timeSlot: s.timeSlot,
        vehicleId: s.vehicleId,
        driver: s.driver,
        color: s.color,
        icon: s.icon,
        nextDay: dayNames[next.day],
        nextDate: nextDate.toISOString().split('T')[0],
        daysUntil: next.diff,
        isToday: next.diff === 0,
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    res.json(result);
  } catch (e) { next(e); }
}
