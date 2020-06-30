const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
    massageType: { type: String, require: true },
    duration: { type: Number, require: true },
    contactNumber: { type: String, required: true },
    address: { type: String, require: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    date: { type: Date, require: true, default: Date.now },
    isDeleted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const validateBookings = (bookings) => {
  const schema = {
    massageType: Joi.string().required(),
    duration: Joi.number().min(60).max(120).required(),
    contactNumber: Joi.string().min(11).max(20).required(),
    address: Joi.string().min(3).max(255).required(),
    city: Joi.string().min(3).max(255).required(),
    zip: Joi.string().min(6).max(255).required(),
    date: Joi.date().greater("now").required(),
  };

  return Joi.validate(bookings, schema);
};

const Booking = mongoose.model("Booking", bookingSchema);

exports.Booking = Booking;
exports.validate = validateBookings;
