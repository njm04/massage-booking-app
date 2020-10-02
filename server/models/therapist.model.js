const mongoose = require("mongoose");
const { User } = require("./user.model");

const Schema = mongoose.Schema;

const therapistSchema = new Schema({
  isAvailable: { type: Boolean, required: true, default: true },
  createdBy: {
    type: new Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      userType: { type: String, required: true },
    }),
    required: true,
  },
});

const Therapist = User.discriminator("therapist", therapistSchema);

exports.Therapist = Therapist;
