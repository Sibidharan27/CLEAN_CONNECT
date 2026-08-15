import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  status: String,
  time: { type: Date, default: Date.now },
  note: String,
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    address: String,
    latitude: Number,
    longitude: Number,
  },
  images: [String],
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timeline: [timelineEntrySchema],
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
