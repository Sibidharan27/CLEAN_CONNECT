import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicleId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  stops: [{
    stopNumber: Number,
    address: String,
    area: String,
    street: String,        // actual street name the stop is on
    landmark: String,
    latitude: Number,
    longitude: Number,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
    complaintsCount: { type: Number, default: 0 },
    completedAt: Date,
  }],
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);
