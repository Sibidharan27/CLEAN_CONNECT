import mongoose from 'mongoose';
export default mongoose.model('VehicleLocation', new mongoose.Schema({ vehicleId: { type: String, required: true }, latitude: Number, longitude: Number, recordedAt: { type: Date, default: Date.now } }));
