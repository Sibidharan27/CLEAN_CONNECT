import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleId:    { type: String, required: true, unique: true, trim: true },
  type:         { type: String, required: true, enum: ['garbage_truck', 'jcb', 'mini_loader', 'road_sweeper'], default: 'garbage_truck' },
  plateNumber:  { type: String, required: true, trim: true },
  capacity:     { type: String, default: '' },              // e.g. "5 Tonnes", "1.5 cubic m"
  status:       { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  currentArea:  { type: String, default: 'Peelamedu' },
  fuelLevel:    { type: Number, min: 0, max: 100, default: 100 },
  lastServiceDate: { type: Date, default: null },
  notes:        { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
