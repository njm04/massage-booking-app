const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");
Joi.objectId = require("joi-objectid")(Joi);

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    password: { type: String, required: true },
    userType: { type: Schema.Types.ObjectId, ref: "UserType" },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { discriminatorKey: "kind", id: false },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAuthToken = function () {
  const payload = {
    _id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    userType: this.userType,
  };

  return jwt.sign(payload, config.get("jwtPrivateKey"));
};

const User = mongoose.model("User", userSchema);

const validateUsers = (user) => {
  const schema = {
    email: Joi.string().min(5).max(255).email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    age: Joi.number().min(0).required(),
    password: Joi.string().min(5).max(1000).required(),
    userType: Joi.objectId().required(),
    isDeleted: Joi.boolean(),
  };

  return Joi.validate(user, schema);
};

exports.User = User;
exports.validate = validateUsers;
