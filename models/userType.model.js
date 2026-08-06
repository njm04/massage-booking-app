import mongoose from "mongoose";
import Joi from "joi";

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
  const schema = Joi.object({
    name: Joi.string().min(4).max(50).required(),
  });

  return schema.validate(type);
};

export { UserType, validateUserTypes as validate };
