/**
 * Missed-Collection Alert Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles admin operations on MissedCollectionAlert documents.
 * All identity is derived from req.user (set by authMiddleware) — never trusted from client.
 */

import MissedCollectionAlert from '../models/MissedCollectionAlert.js';
import Complaint from '../models/Complaint.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';
import { createNotification } from './notificationController.js';

// ─── Valid status transitions ──────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  new:                  ['under_review', 'dismissed'],
  under_review:         ['driver_contacted', 'recollection_required', 'resolved', 'dismissed'],
  driver_contacted:     ['recollection_required', 'under_review', 'resolved', 'dismissed'],
  recollection_required:['resolved', 'dismissed'],
  resolved:             [],  // terminal
  dismissed:            [],  // terminal (new cycle can create fresh alert)
};

// ─── Helper: Expo push notification (best-effort, non-blocking) ───────────────
async function sendExpoPush(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, title, body, data, sound: 'default' }),
    });
  } catch (e) {
    console.warn('[AlertController] Push delivery failed (non-blocking):', e.message);
  }
}

// ─── LIST alerts (admin) ──────────────────────────────────────────────────────
export async function listAlerts(req, res, next) {
  try {
    const {
      status, priority, zone, street, driver, date,
      page = 1, limit = 20,
    } = req.query;

    const filter = {};
    if (status   && status   !== 'all') filter.status   = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (zone     && zone     !== 'all') filter.zone     = { $regex: zone,   $options: 'i' };
    if (street   && street   !== 'all') filter.street   = { $regex: street, $options: 'i' };
    if (driver   && driver   !== 'all') {
      if (/^[a-f\d]{24}$/i.test(driver)) filter.driver = driver;
    }
    if (date) filter.collectionDate = date;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      MissedCollectionAlert.find(filter)
        .populate('driver', 'name email phone vehicleId zone')
        .populate({ path: 'reports', select: 'citizen description images createdAt status category', populate: { path: 'citizen', select: 'name phone' } })
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MissedCollectionAlert.countDocuments(filter),
    ]);

    res.json({
      alerts,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (e) { next(e); }
}

// ─── GET single alert detail (admin) ─────────────────────────────────────────
export async function getAlert(req, res, next) {
  try {
    const alert = await MissedCollectionAlert.findById(req.params.id)
      .populate('driver', 'name email phone vehicleId zone shift expoPushToken')
      .populate({
        path: 'reports',
        select: 'citizen category description images location createdAt status timeline',
        populate: { path: 'citizen', select: 'name email phone street zone' },
      })
      .populate('route', 'date status stops startedAt completedAt zoneName vehicleId')
      .lean();

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json(alert);
  } catch (e) { next(e); }
}

// ─── UPDATE alert status (admin) ─────────────────────────────────────────────
export async function updateAlertStatus(req, res, next) {
  try {
    const { status, note, reason } = req.body;

    if (!status) return res.status(400).json({ message: 'status is required' });

    const alert = await MissedCollectionAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    // Validate transition
    const allowed = VALID_TRANSITIONS[alert.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition: '${alert.status}' → '${status}'. Allowed: [${allowed.join(', ')}]`,
      });
    }

    // Require a reason/note for dismissal and resolution
    if (['dismissed', 'resolved'].includes(status) && !note && !reason) {
      return res.status(400).json({
        message: `A note or reason is required when ${status === 'dismissed' ? 'dismissing' : 'resolving'} an alert.`,
      });
    }

    const adminName = req.user?.name || req.user?.email || 'Admin';
    const prevStatus = alert.status;
    alert.status = status;

    alert.auditTrail = alert.auditTrail || [];
    alert.auditTrail.push({
      action:    `status_changed_to_${status}`,
      status,
      adminId:   req.user._id,
      adminName,
      note:      note || reason || `Status updated to ${status}`,
      time:      new Date(),
    });

    if (note) {
      alert.investigationNotes = alert.investigationNotes || [];
      alert.investigationNotes.push(note);
    }

    await alert.save();

    // ── Sync linked citizen complaints + notify citizens ──────────────────────
    // When an alert reaches a terminal status, update the related complaint
    // records so citizens see the correct status in their app and notifications.
    if (['resolved', 'dismissed'].includes(status) && alert.reports?.length) {
      const complaintStatus = status === 'resolved' ? 'resolved' : 'closed';
      const notifTitle = status === 'resolved'
        ? 'Missed Collection Resolved ✅'
        : 'Missed Collection Report Closed';
      const notifBody = status === 'resolved'
        ? `Your missed-collection report for ${alert.street} has been investigated and resolved by the municipality.`
        : `Your missed-collection report for ${alert.street} has been reviewed and closed.`;

      // Track which citizens we already notified to avoid duplicate notifications
      const notifiedCitizens = new Set();

      for (const reportId of alert.reports) {
        try {
          const complaint = await Complaint.findById(reportId);
          if (!complaint) continue;

          // Only update if still in an open/pending state
          if (!['resolved', 'closed'].includes(complaint.status)) {
            complaint.status = complaintStatus;
            complaint.timeline = complaint.timeline || [];
            complaint.timeline.push({
              status: complaintStatus,
              time:   new Date(),
              note:   `${status === 'resolved' ? 'Resolved' : 'Closed'} by admin after missed-collection investigation. ${note || reason || ''}`.trim(),
            });
            await complaint.save();
          }

          // Send one notification per citizen (not per complaint)
          const citizenId = complaint.citizen?.toString();
          if (citizenId && !notifiedCitizens.has(citizenId)) {
            notifiedCitizens.add(citizenId);
            await createNotification(citizenId, notifTitle, notifBody, 'complaint');
          }
        } catch (syncErr) {
          // Non-blocking: log but don't fail the whole response
          console.error('[AlertController] Complaint sync error:', syncErr.message);
        }
      }
    }

    res.json(alert);

  } catch (e) { next(e); }
}

// ─── ADD investigation note (admin) ──────────────────────────────────────────
export async function addNote(req, res, next) {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) return res.status(400).json({ message: 'note is required' });

    const alert = await MissedCollectionAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const adminName = req.user?.name || req.user?.email || 'Admin';
    alert.investigationNotes = alert.investigationNotes || [];
    alert.investigationNotes.push(note.trim());

    alert.auditTrail = alert.auditTrail || [];
    alert.auditTrail.push({
      action:    'note_added',
      adminId:   req.user._id,
      adminName,
      note:      note.trim(),
      time:      new Date(),
    });

    await alert.save();
    res.json(alert);
  } catch (e) { next(e); }
}

// ─── REQUEST recollection (admin) ─────────────────────────────────────────────
export async function requestRecollection(req, res, next) {
  try {
    const { note } = req.body;

    const alert = await MissedCollectionAlert.findById(req.params.id)
      .populate('driver', 'name email phone vehicleId expoPushToken');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (['resolved', 'dismissed'].includes(alert.status)) {
      return res.status(400).json({ message: 'Cannot request recollection on a resolved or dismissed alert' });
    }

    const adminName = req.user?.name || req.user?.email || 'Admin';

    alert.recollection = {
      requestedAt: new Date(),
      requestedBy: req.user._id,
      status:      'requested',
      note:        note || `Recollection requested for ${alert.street} by ${adminName}`,
    };

    alert.status = 'recollection_required';
    alert.auditTrail = alert.auditTrail || [];
    alert.auditTrail.push({
      action:    'recollection_requested',
      status:    'recollection_required',
      adminId:   req.user._id,
      adminName,
      note:      note || 'Recollection request issued to assigned driver.',
      time:      new Date(),
    });

    await alert.save();

    // Notify driver via Expo push (best-effort)
    if (alert.driver?.expoPushToken) {
      await sendExpoPush(
        alert.driver.expoPushToken,
        '🚛 Recollection Required',
        `Please revisit ${alert.street} for a missed collection. Check the app for details.`,
        { alertId: alert._id.toString(), type: 'recollection_required' }
      );
    }

    // Create in-app notification for driver if possible
    if (alert.driver?._id) {
      await createNotification(
        alert.driver._id,
        'Recollection Required',
        `You have a recollection request for ${alert.street}. Please revisit when possible.`,
        'general'
      );
    }

    res.json(alert);
  } catch (e) { next(e); }
}

// ─── UPDATE recollection status (driver or admin) ────────────────────────────
export async function updateRecollectionStatus(req, res, next) {
  try {
    const { status, note } = req.body;
    const validStatuses = ['acknowledged', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const alert = await MissedCollectionAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!alert.recollection) return res.status(400).json({ message: 'No recollection request on this alert' });

    // Drivers can only update their own alert's recollection
    if (req.user.role === 'driver') {
      if (alert.driver?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not the assigned driver for this alert' });
      }
    }

    const actorName = req.user?.name || req.user?.email || 'System';
    alert.recollection.status = status;
    if (status === 'completed') alert.recollection.completedAt = new Date();

    alert.auditTrail = alert.auditTrail || [];
    alert.auditTrail.push({
      action:    `recollection_${status}`,
      adminName: actorName,
      note:      note || `Recollection marked as ${status}.`,
      time:      new Date(),
    });

    // Auto-resolve if recollection completed
    if (status === 'completed' && alert.status === 'recollection_required') {
      alert.status = 'resolved';
      alert.auditTrail.push({
        action:    'auto_resolved',
        adminName: actorName,
        note:      'Alert auto-resolved after recollection was completed.',
        time:      new Date(),
      });
    }

    await alert.save();
    res.json(alert);
  } catch (e) { next(e); }
}

// ─── GET alert stats for admin dashboard KPI ─────────────────────────────────
export async function getAlertStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [
      totalAlerts,
      newAlerts,
      underReview,
      highPriority,
      resolvedToday,
      todayAlerts,
    ] = await Promise.all([
      MissedCollectionAlert.countDocuments(),
      MissedCollectionAlert.countDocuments({ status: 'new' }),
      MissedCollectionAlert.countDocuments({ status: { $in: ['under_review', 'driver_contacted'] } }),
      MissedCollectionAlert.countDocuments({ priority: { $in: ['high', 'critical'] }, status: { $nin: ['resolved', 'dismissed'] } }),
      MissedCollectionAlert.countDocuments({ status: 'resolved', collectionDate: today }),
      MissedCollectionAlert.countDocuments({ collectionDate: today }),
    ]);

    res.json({ totalAlerts, newAlerts, underReview, highPriority, resolvedToday, todayAlerts });
  } catch (e) { next(e); }
}
