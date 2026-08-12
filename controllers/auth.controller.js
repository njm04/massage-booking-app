import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConfigValue } from "../startup/env.js";
import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";
import { UserType } from "../models/userType.model.js";

const validate = (req) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(4).max(1000).required(),
  });

  return schema.validate(req);
};

export const login = async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email })
    .populate("userType", "_id name")
    .select("_id name password firstName lastName status confirmed userType");

  if (!user) return res.status(400).send("Invalid password or email");

  let userTypeName = null;
  if (user.userType && typeof user.userType === "object" && user.userType.name) {
    userTypeName = user.userType.name.toLowerCase();
  } else if (user.userType) {
    const userTypeDoc = await UserType.findById(user.userType).select("name");
    userTypeName = userTypeDoc?.name?.toLowerCase();
  }

  if (!user.confirmed && userTypeName === "customer")
    return res.status(400).send("Please verify your email.");
  if (user.status === "suspend")
    return res.status(400).send("Account has been suspended");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid password or email");

  const token = user.generateAuthToken();
  res.send(token);
};

export const confirmEmail = async (req, res) => {
  try {
    const {
      user: { _id },
    } = jwt.verify(req.params.token, getConfigValue("EMAIL_SECRET", "booking_emailSecret"));

    const user = await Customer.findById(_id);
    if (!user) return res.status(400).send("User not found");

    if (user.confirmed) {
      res.render("emailConfirmed");
    } else {
      await Customer.updateOne(
        { _id: user._id },
        { confirmed: true, status: "active" },
      );
      res.redirect(getConfigValue("CONFIRMED_URI", "booking_CONFIRMED_URI"));
    }
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};
