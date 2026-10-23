import mongoose from 'mongoose';

// ─── Audit/Timeline Entry ─────────────────────────────────────────────────────
const auditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  status: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: String,
  note: String,
  time: { type: Date, default: Date.now },
}, { _id: false });

// ─── Recollection Request ─────────────────────────────────────────────────────
const recollectionSchema = new mongoose.Schema({
  requestedAt: { type: Date, default: Date.now },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['requested', 'acknowledged', 'completed', 'cancelled'],
    default: 'requested',
  },
  note: String,
  completedAt: Date,
}, { _id: false });

// ─── Missed-Collection Alert / Incident ──────────────────────────────────────
const alertSchema = new mongoose.Schema({
  // Unique grouping key: same street + collection date — prevents duplicate incidents
  street:          { type: String, required: true, trim: true },
  zone:            { type: String, required: true, trim: true },
  area:            { type: String, default: 'Peelamedu' },
  collectionDate:  { type: String, required: true }, // YYYY-MM-DD

  // References
  driver:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicleId: { type: String },
  route:    { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },

  // Reports associated with this alert (references to Complaint docs)
  reports:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  independentReportCount: { type: Number, default: 0 }, // deduplicated citizen count

  // Evidence summary from collection/GPS records
  evidence: {
    routeStatus:         String,  // 'pending' | 'active' | 'completed'
    stopStatus:          String,  // stop-level status for this street
    stopCompletedAt:     Date,
    stopArrivedAt:       Date,    // first GPS arrival near the stop
    collectionDurationMinutes: Number,
    driverNearStreet:    Boolean,
    shortDurationFlag:   Boolean, // < 3 minutes at stop is suspicious
    exceptionReason:     String,  // Unable-to-collect reason if driver logged one
    gpsCoordinates:      [{ latitude: Number, longitude: Number, recordedAt: Date }],
    summary:             String,  // human-readable explanation of what was found
  },

  // Detection explanation
  detectionReason: { type: String }, // e.g. "3 independent reports within 60 minutes. Short collection duration detected."
  triggeredRules:  [String], // e.g. ['threshold_2_30min', 'short_duration']

  // Alert lifecycle
  status: {
    type: String,
    enum: ['new', 'under_review', 'driver_contacted', 'recollection_required', 'resolved', 'dismissed'],
    default: 'new',
  },
  priority: {
    type: String,
    enum: ['medium', 'high', 'critical'],
    default: 'medium',
  },

  // Timing
  firstReportAt:  Date,
  lastReportAt:   Date,

  // Admin investigation
  investigationNotes: [{ type: String }],
  recollection: recollectionSchema,
  auditTrail:   [auditEntrySchema],

  // Notification tracking — prevent duplicate push on unchanged alerts
  lastNotifiedAt: Date,
  notificationHash: String, // hash of (priority+status+reportCount) to detect changes
}, { timestamps: true });

// Compound unique index: one active incident per street per collection date
alertSchema.index({ street: 1, collectionDate: 1, status: 1 });
alertSchema.index({ zone: 1, collectionDate: 1 });
alertSchema.index({ driver: 1, collectionDate: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ createdAt: -1 });

export default mongoose.model('MissedCollectionAlert', alertSchema);
