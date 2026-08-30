import mongoose from "mongoose";
import { User } from "./user.model.js";

export interface Reservation {
  _id: mongoose.Types.ObjectId;
  massageType: string;
  name: string;
  duration: number;
  date: Date;
}

interface TherapistDocument extends mongoose.Document {
  isAvailable: boolean;
  reservations: Reservation[];
  createdBy: {
    firstName: string;
    lastName: string;
    userType: string;
  };
  addReservation(
    reservation: Reservation,
    session?: mongoose.ClientSession,
  ): Promise<void>;
  removeReservation(reservationId: mongoose.Types.ObjectId): Promise<void>;
}

const therapistSchema = new mongoose.Schema<TherapistDocument>(
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

therapistSchema.methods.addReservation = async function (
  this: TherapistDocument,
  reservation: {
    _id: mongoose.Types.ObjectId;
    massageType: string;
    name: string;
    duration: number;
    date: Date;
  },
  session?: mongoose.ClientSession,
) {
  this.reservations.push(reservation);
  return this.save({ session });
};

therapistSchema.methods.removeReservation = async function (
  this: TherapistDocument,
  reservationId: mongoose.Types.ObjectId,
) {
  this.reservations = this.reservations.filter(
    (reservation) => !reservation._id.equals(reservationId),
  );
  return this.save();
};

const Therapist = User.discriminator("therapist", therapistSchema);

export { Therapist };
