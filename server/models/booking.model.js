const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    user: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        userType: {
          type: new Schema({
            name: { type: String, required: true },
          }),
        },
      }),
    },
    therapist: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
      }),
    },
    massageType: { type: String, required: true },
    duration: { type: Number, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, require: true },
    addressTwo: { type: String, default: "" },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    isDeleted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const validateBookings = (bookings) => {
  const schema = {
    therapist: Joi.objectId().required(),
    massageType: Joi.string().required(),
    duration: Joi.number().min(60).max(120).required(),
    contactNumber: Joi.string().min(10).max(20).required(),
    address: Joi.string().min(3).max(255).required(),
    state: Joi.string().max(255).required(),
    addressTwo: Joi.string().max(10),
    city: Joi.string().min(3).max(255).required(),
    zip: Joi.string().min(6).max(255).required(),
    date: Joi.date().required(),
  };

  return Joi.validate(bookings, schema);
};

const Booking = mongoose.model("Booking", bookingSchema);

exports.Booking = Booking;
exports.validate = validateBookings;
