const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, require: true, unique: true },
    firstName: { type: String, require: true },
    lastName: { type: String, require: true },
    age: { type: Number, require: true },
    password: { type: String, require: true },
  },
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
  };

  return Joi.validate(user, schema);
};

exports.User = User;
exports.validate = validateUsers;
