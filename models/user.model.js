import mongoose from "mongoose";
import Joi from "joi";
import jwt from "jsonwebtoken";
import JoiObjectId from "joi-objectid";
import { getConfigValue } from "../startup/env.js";
import dayjs from "dayjs";
Joi.objectId = JoiObjectId(Joi);

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    birthDate: { type: Date, required: true, default: Date.now },
    age: { type: Number },
    createdBy: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        userType: { type: String, required: true },
      }),
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "suspend", "unverified"],
      default: "active",
    },
    password: { type: String, required: true },
    userType: { type: Schema.Types.ObjectId, ref: "UserType" },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
  { discriminatorKey: "kind", id: false }
);

userSchema.pre("save", function (next) {
  this.age = dayjs().diff(this.birthDate, "years");
  next();
});

userSchema.methods.generateAuthToken = function () {
  const payload = {
    _id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    userType: this.userType,
  };

  return jwt.sign(payload, getConfigValue("jwtPrivateKey", "booking_jwtPrivateKey"));
};

userSchema.statics.findUserByIdAndPopulate = function (id) {
  return this.findById(id)
    .populate("userType", "_id name")
    .select(
      "_id firstName lastName email isAvailable reservations gender birthDate status createdBy"
    );
};

const User = mongoose.model("User", userSchema);

const validateUsers = (user) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    birthDate: Joi.date().required(),
    gender: Joi.string().required(),
    password: Joi.string().min(5).max(1000).required(),
    userType: Joi.objectId().required(),
    status: Joi.string().required(),
    isDeleted: Joi.boolean(),
  });

  return schema.validate(user);
};

export { User, validateUsers as validate };
