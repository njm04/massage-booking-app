const mongoose = require("mongoose");
const { User } = require("./user.model");

const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    createdBy: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: { type: String, required: true },
      }),
      required: true,
    },
    confirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Customer = User.discriminator("customer", customerSchema);

exports.Customer = Customer;
