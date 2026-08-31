import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const citizenSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, default: 'citizen', immutable: true },
  phone:    String,
  address:  String,
  area:     String,
  expoPushToken: String,
}, { timestamps: true, collection: 'citizens' });

citizenSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
citizenSchema.methods.matchesPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('Citizen', citizenSchema);
