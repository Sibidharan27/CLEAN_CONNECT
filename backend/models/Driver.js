import mongoose from "mongoose";
export default mongoose.model(
  "Driver",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      vehicleNumber: String,
      available: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
