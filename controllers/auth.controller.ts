import type { Request, Response } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConfigValue } from "../startup/env.js";
import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";
import { UserType } from "../models/userType.model.js";

const validate = (req: Record<string, any>) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(4).max(1000).required(),
  });

  return schema.validate(req);
};

export const canUserLogin = ({
  confirmed,
  status,
  userTypeName,
}: {
  confirmed?: boolean;
  status?: string;
  userTypeName?: string | null;
}) => {
  if (userTypeName === "customer" && !confirmed) {
    return { allowed: false, reason: "Please verify your email." };
  }

  if (status === "suspend") {
    return { allowed: false, reason: "Account has been suspended" };
  }

  return { allowed: true, reason: null };
};

export const login = async (req: Request, res: Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email })
    .populate("userType", "_id name")
    .select(
      "+password _id name firstName lastName status confirmed userType email",
    );

  if (!user) return res.status(400).send("Invalid password or email");

  let userTypeName: string | null = null;
  if (
    user.userType &&
    typeof user.userType === "object" &&
    "name" in user.userType
  ) {
    const populatedUserType = user.userType as { name?: string };
    if (populatedUserType.name)
      userTypeName = populatedUserType.name.toLowerCase();
  } else if (user.userType) {
    const userTypeDoc = await UserType.findById(user.userType).select("name");
    userTypeName = userTypeDoc?.name?.toLowerCase() ?? null;
  }

  const typedUser = user as typeof user & {
    generateAuthToken: () => string;
    password: string;
    status: string;
  };

  const loginCheck = canUserLogin({
    confirmed: user.get("confirmed") as boolean,
    status: typedUser.status,
    userTypeName,
  });

  if (!loginCheck.allowed) return res.status(400).send(loginCheck.reason);

  const validPassword = await bcrypt.compare(
    req.body.password,
    typedUser.password,
  );
  if (!validPassword) return res.status(400).send("Invalid password or email");

  const token = typedUser.generateAuthToken();
  res.send(token);
};

export const confirmEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.params.token === "string" ? req.params.token : "";
    const secret = getConfigValue("EMAIL_SECRET", "booking_emailSecret");
    if (!secret) return res.status(400).send("User not found");

    const payload = jwt.verify(token, secret) as unknown as {
      user?: { _id?: string };
    };

    const _id = payload.user?._id;
    if (!_id) return res.status(400).send("User not found");

    const user = await Customer.findById(_id);
    if (!user) return res.status(400).send("User not found");

    if (user.confirmed) {
      res.render("emailConfirmed");
    } else {
      await Customer.updateOne(
        { _id: user._id },
        { confirmed: true, status: "active" },
      );
      const redirectUri = getConfigValue(
        "CONFIRMED_URI",
        "booking_CONFIRMED_URI",
      );
      if (!redirectUri) return res.status(400).send("User not found");
      res.redirect(redirectUri);
    }
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};
