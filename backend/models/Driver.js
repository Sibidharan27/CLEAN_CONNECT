import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Full driver model with its own 'drivers' collection for auth + profile
const driverSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, default: 'driver', immutable: true },
  phone:      String,
  employeeId: String,
  vehicleId:  String,
  zone:       String,
  shift:      String,
  joiningDate: String,
  expoPushToken: String,
}, { timestamps: true, collection: 'drivers' });

driverSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
driverSchema.methods.matchesPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('Driver', driverSchema);
