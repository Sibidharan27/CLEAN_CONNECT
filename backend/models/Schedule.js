import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  area: { type: String, required: true },
  zone: { type: String, required: true },
  type: {
    type: String,
    enum: ['General Waste', 'Recyclables', 'Organic Waste', 'Hazardous'],
    required: true,
  },
  dayOfWeek: [{ type: Number }], // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  timeSlot: { type: String, default: '7:00 AM - 10:00 AM' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: String,
  color: { type: String, default: '#2E7D32' },
  icon: { type: String, default: 'trash-can' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Schedule', scheduleSchema);
