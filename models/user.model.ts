import mongoose, { type Model, type Types } from "mongoose";
import Joi from "joi";
import jwt from "jsonwebtoken";
import JoiObjectId from "joi-objectid";
import dayjs from "dayjs";
import { getConfigValue } from "../startup/env.js";

(Joi as any).objectId = JoiObjectId(Joi);

type UserDocument = {
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: Date;
  age?: number;
  createdBy: {
    firstName: string;
    lastName: string;
    userType: string;
  };
  status: "active" | "suspend" | "unverified";
  password: string;
  userType?: Types.ObjectId | string | null;
  isDeleted: boolean;
  kind?: string;
  __t?: string;
  reservations?: any[];
  generateAuthToken(): string;
};

type UserModel = Model<UserDocument> & {
  findUserByIdAndPopulate(id: string | Types.ObjectId): any;
};

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    birthDate: { type: Date, required: true, default: Date.now },
    age: { type: Number },
    createdBy: {
      type: new mongoose.Schema({
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
    userType: { type: mongoose.Schema.Types.ObjectId, ref: "UserType" },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    discriminatorKey: "kind",
    id: false,
  },
);

userSchema.pre("save", function (next) {
  this.age = dayjs().diff(this.birthDate, "years");
  next();
});

userSchema.methods.generateAuthToken = function (this: UserDocument) {
  const payload = {
    _id: (this as any)._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    userType: this.userType,
  };

  const secret = getConfigValue("jwtPrivateKey", "booking_jwtPrivateKey");
  if (!secret) throw new Error("JWT secret is not configured");

  return jwt.sign(payload, secret);
};

userSchema.statics.findUserByIdAndPopulate = function (
  this: any,
  id: string | Types.ObjectId,
) {
  return this.findById(id)
    .populate("userType", "_id name")
    .select(
      "_id firstName lastName email isAvailable reservations gender birthDate status createdBy",
    );
};

const User = mongoose.model<UserDocument, UserModel>("User", userSchema);

const validateUsers = (user: Record<string, any>) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    birthDate: Joi.date().required(),
    gender: Joi.string().required(),
    password: Joi.string().min(5).max(1000).required(),
    userType: (Joi as any).objectId().required(),
    status: Joi.string().required(),
    isDeleted: Joi.boolean(),
  });

  return schema.validate(user);
};

export { User, validateUsers as validate };
