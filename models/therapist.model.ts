import mongoose from "mongoose";
import { User } from "./user.model.js";

const therapistSchema = new mongoose.Schema(
  {
    isAvailable: { type: Boolean, required: true, default: true },
    reservations: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId },
        massageType: { type: String },
        name: { type: String },
        duration: { type: Number },
        date: { type: Date },
      },
    ],
    createdBy: {
      type: new mongoose.Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: { type: String, required: true },
      }),
      required: true,
    },
  },
  { timestamps: true },
);

const Therapist = User.discriminator("therapist", therapistSchema);

export { Therapist };
