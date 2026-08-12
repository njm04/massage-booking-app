import mongoose from "mongoose";
import Joi from "joi";
import JoiObjectId from "joi-objectid";

(Joi as any).objectId = JoiObjectId(Joi);

const bookingSchema = new mongoose.Schema(
  {
    createdBy: {
      type: new mongoose.Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: {
          type: new mongoose.Schema({
            name: { type: String, required: true },
          }),
        },
      }),
    },
    therapist: {
      type: new mongoose.Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
      }),
    },
    customer: {
      type: new mongoose.Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
      }),
      required: true,
    },
    massageType: { type: String, required: true },
    duration: { type: Number, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    addressTwo: { type: String, default: "" },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    isDeleted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      required: true,
      enum: ["pending", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const validateBookings = (bookings: Record<string, any>, user: any) => {
  const schema = Joi.object({
    therapist: (Joi as any).objectId().required(),
    prevTherapist: (Joi as any).objectId(),
    massageType: Joi.string().required(),
    duration: Joi.number().min(60).max(120).required(),
    contactNumber: Joi.string().min(10).max(20).required(),
    address: Joi.string().min(3).max(255).required(),
    state: Joi.string().max(255).required(),
    firstName: Joi.string().max(255).required(),
    lastName: Joi.string().max(255).required(),
    email:
      user?.userType?.name === "admin"
        ? Joi.string().min(5).max(255).email().required()
        : Joi.string().min(5).max(255).email(),
    addressTwo: Joi.string().max(10).optional().allow(""),
    city: Joi.string().min(3).max(255).required(),
    zip: Joi.string().min(6).max(255).required(),
    date: Joi.date().required(),
  });

  return schema.validate(bookings);
};

const Booking = mongoose.model("Booking", bookingSchema);

export { Booking, validateBookings as validate };
