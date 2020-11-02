const mongoose = require("mongoose");
const { User } = require("./user.model");

const Schema = mongoose.Schema;

const therapistSchema = new Schema(
  {
    isAvailable: { type: Boolean, required: true, default: true },
    reservations: [
      {
        _id: { type: Schema.Types.ObjectId },
        massageType: { type: String },
        name: { type: String },
        duration: { type: Number },
        date: { type: Date },
      },
    ],
    createdBy: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: { type: String, required: true },
      }),
      required: true,
    },
  },
  { timestamps: true }
);

const Therapist = User.discriminator("therapist", therapistSchema);

exports.Therapist = Therapist;
