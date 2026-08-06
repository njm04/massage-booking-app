import mongoose from "mongoose";
import { User } from "./user.model.js";

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

export { Customer };
