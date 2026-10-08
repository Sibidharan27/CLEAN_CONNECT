import Complaint from '../models/Complaint.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import { PEELAMEDU_ZONES } from '../utils/zonesData.js';

export const summary = async (_req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [totalComplaints, activeVehicles, activeRoutes, resolvedCount] = await Promise.all([
      Complaint.countDocuments(),
      Vehicle.countDocuments({ status: 'active' }),
      Route.countDocuments({ date: today, status: 'active' }),
      Complaint.countDocuments({ status: 'resolved' }),
    ]);
    res.json({ complaints: totalComplaints, activeVehicles, activeRoutes, resolvedCount });
  } catch (e) {
    next(e);
  }
};

// ─── Garbage Hotspot Analysis & Zone Prioritization ───────────────────────────
export async function getHotspotAnalytics(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allComplaints = await Complaint.find().populate('citizen', 'name email phone').populate('assignedDriver', 'name phone vehicleId');
    const todayRoutes = await Route.find({ date: today });

    // Group complaints by Zone and Street
    const zoneData = PEELAMEDU_ZONES.map((zone) => {
      // Find all complaints belonging to this zone (by zone name match or street match)
      const zoneComplaints = allComplaints.filter((c) => {
        const cZone = (c.zone || '').toLowerCase();
        const cStreet = (c.street || c.location?.address || '').toLowerCase();
        const zName = zone.name.toLowerCase();
        const zShort = zone.shortName.toLowerCase();
        return (
          cZone.includes(zShort) ||
          cZone.includes(zName) ||
          zone.streets.some((s) => cStreet.includes(s.name.toLowerCase()))
        );
      });

      const total = zoneComplaints.length;
      const open = zoneComplaints.filter((c) => c.status === 'open').length;
      const inProgress = zoneComplaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;
      const resolved = zoneComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
      const highPriority = zoneComplaints.filter((c) => c.priority === 'high' && c.status !== 'resolved').length;
      const overflowingBins = zoneComplaints.filter((c) => c.category?.toLowerCase().includes('overflow')).length;
      const missedCollections = zoneComplaints.filter((c) => c.category?.toLowerCase().includes('missed')).length;
      const illegalDumping = zoneComplaints.filter((c) => c.category?.toLowerCase().includes('dumping')).length;

      // Street level breakdown
      const streetBreakdown = zone.streets.map((st) => {
        const stComplaints = zoneComplaints.filter((c) => {
          const cStr = (c.street || c.location?.address || '').toLowerCase();
          return cStr.includes(st.name.toLowerCase());
        });
        const stTotal = stComplaints.length;
        const stOpen = stComplaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;
        const stHigh = stComplaints.filter((c) => c.priority === 'high').length;

        let riskLevel = 'Normal';
        if (stTotal >= 5 || stOpen >= 3 || stHigh >= 2) riskLevel = 'Critical Hotspot';
        else if (stTotal >= 2 || stOpen >= 1) riskLevel = 'Moderate Risk';

        return {
          streetName: st.name,
          address: st.address,
          landmark: st.landmark,
          housesCount: st.housesCount,
          binType: st.binType,
          totalComplaints: stTotal,
          openComplaints: stOpen,
          highPriorityComplaints: stHigh,
          riskLevel,
        };
      }).sort((a, b) => b.totalComplaints - a.totalComplaints);

      // Priority Score calculation
      // Score = (Open * 2.5) + (HighPriority * 4.0) + (Overflowing * 2.0) + (Missed * 1.5) - (Resolved * 0.3)
      const priorityScore = Math.max(0, Math.round((open * 2.5) + (highPriority * 4.0) + (overflowingBins * 2.0) + (missedCollections * 1.5) - (resolved * 0.3)));

      let priorityLevel = 'LOW';
      let priorityBadgeClass = 'badge-dim';
      if (priorityScore >= 15 || highPriority >= 3 || open >= 5) {
        priorityLevel = 'CRITICAL';
        priorityBadgeClass = 'badge-red';
      } else if (priorityScore >= 8 || open >= 2) {
        priorityLevel = 'HIGH';
        priorityBadgeClass = 'badge-pending';
      } else if (priorityScore >= 3) {
        priorityLevel = 'MEDIUM';
        priorityBadgeClass = 'badge-blue';
      }

      // Check current route status for this zone
      const zoneRoute = todayRoutes.find((r) => (r.zoneName || '').includes(zone.shortName) || (r.stops?.[0]?.area || '').includes(zone.shortName));
      const completedStops = zoneRoute?.stops?.filter((s) => s.status === 'completed').length || 0;
      const totalStops = zone.streets.length;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        shortName: zone.shortName,
        area: 'Peelamedu',
        driverName: zone.driverName,
        driverEmail: zone.driverEmail,
        vehicleId: zone.vehicleId,
        vehiclePlate: zone.vehiclePlate,
        scheduleDay: zone.scheduleDay,
        timeSlot: zone.timeSlot,
        totalComplaints: total,
        openComplaints: open,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
        highPriorityComplaints: highPriority,
        overflowingBins,
        missedCollections,
        illegalDumping,
        priorityScore,
        priorityLevel,
        priorityBadgeClass,
        routeStatus: zoneRoute?.status || 'pending',
        routeProgress: { completed: completedStops, total: totalStops },
        streets: streetBreakdown,
        categories: {
          overflowing: overflowingBins,
          missed: missedCollections,
          illegalDump: illegalDumping,
          others: Math.max(0, total - (overflowingBins + missedCollections + illegalDumping)),
        },
      };
    });

    // Sort zones by Priority Score descending
    zoneData.sort((a, b) => b.priorityScore - a.priorityScore);

    // High level municipality insights
    const totalOpenInPeelamedu = zoneData.reduce((acc, z) => acc + z.openComplaints, 0);
    const topCriticalStreet = zoneData
      .flatMap((z) => z.streets.map((s) => ({ ...s, zoneName: z.zoneName })))
      .sort((a, b) => b.totalComplaints - a.totalComplaints)[0] || null;

    res.json({
      area: 'Peelamedu',
      totalZones: zoneData.length,
      totalOpenComplaints: totalOpenInPeelamedu,
      highestPriorityZone: zoneData[0]?.zoneName || 'Peelamedu – PSG Zone',
      topCriticalStreet,
      zones: zoneData,
    });
  } catch (e) {
    next(e);
  }
}
