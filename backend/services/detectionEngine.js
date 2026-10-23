/**
 * Missed-Collection Detection Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs on the backend whenever a new missed-collection complaint is submitted.
 * Also callable from a periodic trigger if needed.
 *
 * Design principles:
 *  - Reports alone do not prove misconduct. Evidence is correlated, not concluded.
 *  - Duplicate reports from the same citizen within the same window are collapsed.
 *  - A missing GPS sample is NOT automatically treated as proof of failure.
 *  - All thresholds are stored in DETECTION_CONFIG — single place to tune them.
 */

import Complaint from '../models/Complaint.js';
import MissedCollectionAlert from '../models/MissedCollectionAlert.js';
import Route from '../models/Route.js';
import Driver from '../models/Driver.js';
import VehicleLocation from '../models/VehicleLocation.js';
import { PEELAMEDU_ZONES } from '../utils/zonesData.js';
import mongoose from 'mongoose';

// ─── Configurable detection thresholds ───────────────────────────────────────
export const DETECTION_CONFIG = {
  // Minimum independent citizen reports within the short window to open an alert
  shortWindowReportThreshold: 2,
  shortWindowMinutes: 30,

  // Report count that elevates to HIGH priority
  highPriorityReportThreshold: 3,
  highPriorityWindowMinutes: 60,

  // Short collection duration flag (minutes). Below this value at a stop → suspicious
  shortCollectionMinutes: 3,

  // Proximity radius (metres) for GPS evidence — driver "near" the street
  gpsProximityMeters: 100,

  // Max age of GPS samples to consider still relevant (minutes)
  gpsMaxAgeMins: 180,
};

// ─── Haversine distance helper ────────────────────────────────────────────────
function distanceMeters(lat1, lon1, lat2, lon2) {
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

// ─── Find zone config for a street ───────────────────────────────────────────
function getZoneConfig(streetName) {
  if (!streetName) return null;
  const query = streetName.toLowerCase().trim();
  for (const zone of PEELAMEDU_ZONES) {
    const match = zone.streets.find(
      s => s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase())
    );
    if (match) return { zone, street: match };
  }
  return null;
}

// ─── Determine today's expected collection date string ────────────────────────
export function getTodayCollectionDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Core detection function.
 * Call this after a new missed-collection complaint is persisted.
 *
 * @param {string} street        - Street name from the complaint
 * @param {string} zone          - Zone name
 * @param {string} collectionDate - YYYY-MM-DD
 * @returns {object|null}        - The created or updated MissedCollectionAlert, or null
 */
export async function runDetection(street, zone, collectionDate) {
  try {
    if (!street || !collectionDate) return null;

    // ── 1. Gather ALL missed-collection complaints for this street + date ─────
    // Window: reports submitted within ±12 hours of collection date (generous)
    const windowStart = new Date(`${collectionDate}T00:00:00.000Z`);
    const windowEnd   = new Date(`${collectionDate}T23:59:59.999Z`);

    const allReports = await Complaint.find({
      category: { $in: ['missed', 'Missed Collection'] },
      street:   { $regex: street.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      createdAt: { $gte: windowStart, $lte: windowEnd },
    }).lean();

    if (allReports.length === 0) return null;

    // ── 2. Deduplicate by citizen ─────────────────────────────────────────────
    // Count independent citizens (not per-report), collapse duplicates
    const citizenMap = new Map(); // citizenId → earliest report
    for (const r of allReports) {
      const cid = r.citizen?.toString();
      if (!cid) continue;
      if (!citizenMap.has(cid) || r.createdAt < citizenMap.get(cid).createdAt) {
        citizenMap.set(cid, r);
      }
    }
    const independentReports = Array.from(citizenMap.values());
    const independentCount   = independentReports.length;

    // All report IDs (including duplicates, preserved)
    const allReportIds = allReports.map(r => r._id);

    // ── 3. Short-window check (30 min) ────────────────────────────────────────
    const {
      shortWindowReportThreshold,
      shortWindowMinutes,
      highPriorityReportThreshold,
      highPriorityWindowMinutes,
    } = DETECTION_CONFIG;

    // Sort by createdAt ascending
    independentReports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let triggeredRules = [];
    let meetsThreshold = false;
    let priorityLevel  = 'medium';

    if (independentReports.length >= shortWindowReportThreshold) {
      // Sliding window check for 30-minute threshold
      for (let i = 0; i <= independentReports.length - shortWindowReportThreshold; i++) {
        const windowMs = shortWindowMinutes * 60 * 1000;
        const first    = new Date(independentReports[i].createdAt);
        const last     = new Date(independentReports[i + shortWindowReportThreshold - 1]?.createdAt || first);
        if (last - first <= windowMs) {
          meetsThreshold = true;
          triggeredRules.push(`threshold_${shortWindowReportThreshold}_${shortWindowMinutes}min`);
          break;
        }
      }
    }

    // High-priority check: ≥3 independent reports within 60 minutes
    if (independentReports.length >= highPriorityReportThreshold) {
      const windowMs = highPriorityWindowMinutes * 60 * 1000;
      for (let i = 0; i <= independentReports.length - highPriorityReportThreshold; i++) {
        const first = new Date(independentReports[i].createdAt);
        const last  = new Date(independentReports[i + highPriorityReportThreshold - 1]?.createdAt || first);
        if (last - first <= windowMs) {
          priorityLevel = 'high';
          triggeredRules.push(`threshold_${highPriorityReportThreshold}_${highPriorityWindowMinutes}min`);
          break;
        }
      }
      // Still meets threshold even if outside 30-min window
      if (!meetsThreshold) {
        meetsThreshold = true;
        triggeredRules.push('independent_report_count_sufficient');
      }
    }

    if (!meetsThreshold) return null; // Below threshold — no alert yet

    // ── 4. Gather GPS/collection evidence ─────────────────────────────────────
    const evidence = await gatherCollectionEvidence(street, zone, collectionDate);
    if (evidence.shortDurationFlag && !triggeredRules.includes('short_duration')) {
      triggeredRules.push('short_duration');
      if (priorityLevel === 'medium') priorityLevel = 'high';
    }

    // ── 5. Build detection reason string ─────────────────────────────────────
    const detectionReason = buildDetectionReason(independentCount, triggeredRules, evidence);

    // ── 6. Upsert alert (atomic, prevents duplicates) ─────────────────────────
    const firstReportAt = independentReports[0]?.createdAt;
    const lastReportAt  = independentReports[independentReports.length - 1]?.createdAt;

    // Find any existing non-resolved/non-dismissed alert for this street+date
    const existing = await MissedCollectionAlert.findOne({
      street:         { $regex: street.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      collectionDate,
      status:         { $nin: ['resolved', 'dismissed'] },
    });

    if (existing) {
      // Update existing incident — don't create duplicate
      const changed =
        existing.independentReportCount !== independentCount ||
        existing.priority !== priorityLevel;

      existing.reports              = allReportIds;
      existing.independentReportCount = independentCount;
      existing.lastReportAt         = lastReportAt;
      existing.evidence             = { ...existing.evidence, ...evidence };
      existing.detectionReason      = detectionReason;
      existing.triggeredRules       = [...new Set([...(existing.triggeredRules || []), ...triggeredRules])];

      if (changed) {
        const oldPriority = existing.priority;
        existing.priority = priorityLevel;
        if (evidence.driver) existing.driver = evidence.driver;
        if (evidence.vehicleId) existing.vehicleId = evidence.vehicleId;
        if (evidence.routeId)  existing.route  = evidence.routeId;
        existing.auditTrail = existing.auditTrail || [];
        existing.auditTrail.push({
          action: 'evidence_updated',
          note: `Report count updated to ${independentCount}. Priority: ${oldPriority} → ${priorityLevel}.`,
          time: new Date(),
        });
      }

      await existing.save();
      return { alert: existing, isNew: false, changed };
    }

    // Create new alert
    const newAlert = await MissedCollectionAlert.create({
      street,
      zone:   zone || 'Peelamedu – PSG Zone',
      area:   'Peelamedu',
      collectionDate,
      driver:  evidence.driver  || null,
      vehicleId: evidence.vehicleId || null,
      route:   evidence.routeId || null,
      reports: allReportIds,
      independentReportCount: independentCount,
      firstReportAt,
      lastReportAt,
      evidence,
      detectionReason,
      triggeredRules,
      priority: priorityLevel,
      status:  'new',
      auditTrail: [{
        action: 'alert_created',
        note:   `Alert automatically generated. ${detectionReason}`,
        time:   new Date(),
      }],
    });

    return { alert: newAlert, isNew: true };
  } catch (err) {
    console.error('[DetectionEngine] Error:', err.message);
    return null;
  }
}

// ─── Gather GPS and route evidence for the street ────────────────────────────
async function gatherCollectionEvidence(street, zone, collectionDate) {
  const evidence = {
    routeStatus:             null,
    stopStatus:              null,
    stopCompletedAt:         null,
    stopArrivedAt:           null,
    collectionDurationMinutes: null,
    driverNearStreet:        null,
    shortDurationFlag:       false,
    exceptionReason:         null,
    gpsCoordinates:          [],
    driver:                  null,
    vehicleId:               null,
    routeId:                 null,
    summary:                 '',
  };

  try {
    // Find zone config for GPS coordinates of the street
    const zoneConfig = getZoneConfig(street);
    const streetCoords = zoneConfig?.street;

    // Find today's route for this zone
    const route = await Route.findOne({
      date: collectionDate,
      zoneName: { $regex: zone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    }).populate('driver', 'name email vehicleId').lean();

    if (!route) {
      evidence.summary = 'No route record found for this zone on the collection date.';
      return evidence;
    }

    evidence.routeStatus = route.status;
    evidence.driver      = route.driver?._id || null;
    evidence.vehicleId   = route.vehicleId   || null;
    evidence.routeId     = route._id;

    // Find the specific stop for this street
    const stop = route.stops?.find(s =>
      s.street?.toLowerCase().includes(street.toLowerCase()) ||
      street.toLowerCase().includes(s.street?.toLowerCase() || '')
    );

    if (stop) {
      evidence.stopStatus     = stop.status;
      evidence.stopCompletedAt = stop.completedAt || null;

      if (stop.completedAt && stop.status === 'completed') {
        // Try to estimate duration: look at when driver GPS first appeared near the stop
        if (route.startedAt) {
          const startApprox = new Date(route.startedAt);
          const endAt       = new Date(stop.completedAt);
          const durationMins = Math.round((endAt - startApprox) / 60000);
          if (durationMins > 0 && durationMins < 60) {
            evidence.collectionDurationMinutes = durationMins;
            if (durationMins < DETECTION_CONFIG.shortCollectionMinutes) {
              evidence.shortDurationFlag = true;
            }
          }
        }
      }

      // Skip reason as exception evidence
      if (stop.status === 'skipped') {
        evidence.exceptionReason = stop.skipReason || 'Stop was skipped without recorded reason';
      }
    }

    // GPS proximity check — look for vehicle location samples near the street
    if (evidence.vehicleId && streetCoords?.latitude && streetCoords?.longitude) {
      const since = new Date(collectionDate + 'T00:00:00.000Z');
      const until = new Date(collectionDate + 'T23:59:59.999Z');
      const recentSamples = await VehicleLocation.find({
        vehicleId:  evidence.vehicleId,
        recordedAt: { $gte: since, $lte: until },
      }).sort('recordedAt').lean();

      if (recentSamples.length > 0) {
        const nearbySamples = recentSamples.filter(s => {
          const d = distanceMeters(s.latitude, s.longitude, streetCoords.latitude, streetCoords.longitude);
          return d <= DETECTION_CONFIG.gpsProximityMeters;
        });

        evidence.driverNearStreet = nearbySamples.length > 0;
        evidence.gpsCoordinates = nearbySamples.slice(0, 10).map(s => ({
          latitude: s.latitude,
          longitude: s.longitude,
          recordedAt: s.recordedAt,
        }));

        if (nearbySamples.length > 0) {
          evidence.stopArrivedAt = nearbySamples[0].recordedAt;
        }
      } else {
        // No GPS samples at all for the vehicle today — don't treat as failure
        evidence.driverNearStreet = null; // unknown
      }
    }

    // Build human-readable summary
    const parts = [];
    if (evidence.routeStatus) parts.push(`Route status: ${evidence.routeStatus}.`);
    if (evidence.stopStatus)  parts.push(`Stop status for this street: ${evidence.stopStatus}.`);
    if (evidence.stopCompletedAt) parts.push(`Recorded completion: ${new Date(evidence.stopCompletedAt).toLocaleTimeString('en-IN')}.`);
    if (evidence.shortDurationFlag) parts.push('Collection duration was unusually short.');
    if (evidence.driverNearStreet === true) parts.push('GPS data places vehicle near the street.');
    if (evidence.driverNearStreet === false) parts.push('No GPS data places vehicle near this street during the collection window.');
    if (evidence.driverNearStreet === null) parts.push('No GPS samples recorded for this vehicle today.');
    if (evidence.exceptionReason) parts.push(`Exception recorded: ${evidence.exceptionReason}.`);
    evidence.summary = parts.join(' ') || 'Evidence review required.';
  } catch (err) {
    console.error('[DetectionEngine] Evidence gathering error:', err.message);
    evidence.summary = 'Could not retrieve collection evidence automatically.';
  }

  return evidence;
}

// ─── Build human-readable detection reason ───────────────────────────────────
function buildDetectionReason(reportCount, rules, evidence) {
  const parts = [];

  if (reportCount >= DETECTION_CONFIG.shortWindowReportThreshold) {
    parts.push(`${reportCount} independent citizen report${reportCount > 1 ? 's' : ''} received for this street within the collection window.`);
  }

  if (rules.includes(`threshold_${DETECTION_CONFIG.highPriorityReportThreshold}_${DETECTION_CONFIG.highPriorityWindowMinutes}min`)) {
    parts.push(`${reportCount} independent reports received within ${DETECTION_CONFIG.highPriorityWindowMinutes} minutes.`);
  } else if (rules.includes(`threshold_${DETECTION_CONFIG.shortWindowReportThreshold}_${DETECTION_CONFIG.shortWindowMinutes}min`)) {
    parts.push(`${reportCount} independent reports received within ${DETECTION_CONFIG.shortWindowMinutes} minutes.`);
  }

  if (rules.includes('short_duration')) {
    parts.push('Recorded collection duration at this stop was unusually short (below expected minimum).');
  }

  parts.push('Administrator review is required. These signals indicate a possible missed collection but do not independently confirm it.');

  return parts.join(' ');
}

/**
 * Used by the admin to check whether a street has an active alert for a given date.
 */
export async function getActiveAlert(street, collectionDate) {
  return MissedCollectionAlert.findOne({
    street:         { $regex: street.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    collectionDate,
    status:         { $nin: ['resolved', 'dismissed'] },
  });
}
