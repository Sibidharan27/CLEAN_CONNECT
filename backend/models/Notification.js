import mongoose from 'mongoose';

export default mongoose.model('Notification', new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['complaint', 'schedule', 'tracking', 'general'], default: 'general' },
  readAt: { type: Date, default: null },
}, { timestamps: true }));
