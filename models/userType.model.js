const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const userTypeSchema = new Schema(
  {
    name: {
      type: String,
      minLength: 4,
      maxLength: 50,
      lowercase: true,
      required: true,
    },
  },
  { timestamps: true }
);

const UserType = mongoose.model("UserType", userTypeSchema);

const validateUserTypes = (type) => {
  const schema = {
    name: Joi.string().min(4).max(50).required(),
  };

  return Joi.validate(type, schema);
};

exports.UserType = UserType;
exports.validate = validateUserTypes;
