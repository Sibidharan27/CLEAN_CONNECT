import mongoose from 'mongoose';

export default function connectDb() {
  return mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected'));
}
