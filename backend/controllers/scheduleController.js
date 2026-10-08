import Schedule from '../models/Schedule.js';
import Driver from '../models/Driver.js';
import { PEELAMEDU_ZONES } from '../utils/zonesData.js';

// Seed default schedules if none exist
async function seedSchedules() {
  const count = await Schedule.countDocuments();
  if (count > 0) return;

  const schedulesToSeed = [];
  for (const z of PEELAMEDU_ZONES) {
    const driverDoc = await Driver.findOne({ email: z.driverEmail });
    schedulesToSeed.push({
      area: 'Peelamedu',
      zone: z.name,
      streets: z.streets.map(s => s.name),
      type: z.id === 'peelamedu-psg' ? 'General Waste' : z.id === 'peelamedu-hope-college' ? 'Recyclables' : 'Organic Waste',
      dayOfWeek: z.dayOfWeek,
      scheduleDay: z.scheduleDay,
      timeSlot: z.timeSlot,
      vehicleId: z.vehicleId,
      driver: driverDoc?._id || null,
      color: z.color,
      icon: z.icon,
      isActive: true,
    });
  }

  await Schedule.insertMany(schedulesToSeed);
  console.log('Schedules seeded with Peelamedu zone collection model');
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
        area: s.area || 'Peelamedu',
        zone: s.zone,
        streets: s.streets || [],
        scheduleDay: s.scheduleDay || '',
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
