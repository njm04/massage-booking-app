import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Joi from "joi";
import _ from "lodash";
import jwt from "jsonwebtoken";
import { getConfigValue } from "../startup/env.js";
import { User, validate } from "../models/user.model.js";
import { Therapist } from "../models/therapist.model.js";
import { Customer } from "../models/customer.model.js";
import { UserType } from "../models/userType.model.js";
import { Booking } from "../models/booking.model.js";
import transporter from "../startup/transporter.js";

type AuthRequest = Request & {
  user?: {
    _id?: string;
    userType?: { name?: string };
    [key: string]: any;
  };
};

const validateEditUser = (req: Record<string, any>) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    birthDate: Joi.date().required(),
    gender: Joi.string().required(),
    status: Joi.string().required(),
  });

  return schema.validate(req);
};

const validatePassword = (req: Record<string, any>) => {
  const schema = Joi.object({
    password: Joi.string().min(5).max(1000).required(),
    newPassword: Joi.string().min(5).max(1000).required(),
    newPasswordConfirmation: Joi.string().min(5).max(1000).required(),
  });

  return schema.validate(req);
};

const validateStatus = (req: Record<string, any>) => {
  const schema = Joi.object({
    status: Joi.string().valid("active", "suspend").required(),
  });

  return schema.validate(req);
};

const emailMessage = (user: Record<string, any>, url: string) => {
  const style = "margin-bottom: 20px";
  return `
  <p style="${style}">Hi ${user.firstName} ${user.lastName}!</p>
  <p style="${style}">Welcome to THE MASSAGE CLINIC. To verify your email so that you can access your account and start making appointments, click the following link:</p> 
  <p style="${style}"><a href="${url}">${url}</a></p>
  <p style="${style}">Thank you for choosing us.</p>
  `;
};

const emailConfirmation = async (user: any) => {
  const userKind = user.kind || user.__t || user.constructor.modelName;

  if (userKind === "customer") {
    try {
      const emailSecret = getConfigValue("EMAIL_SECRET", "booking_emailSecret");
      if (!emailSecret) return;

      const emailToken = await new Promise((resolve, reject) => {
        jwt.sign(
          { user: _.pick(user, "_id") },
          emailSecret,
          { expiresIn: "1d" },
          (error: Error | null, token?: string) => {
            if (error) return reject(error);
            resolve(token);
          },
        );
      });

      const confirmationUri = getConfigValue("URI", "booking_URI");
      const url = `${confirmationUri ?? ""}/auth/confirmation/${emailToken}`;
      await transporter.sendMail({
        to: user.email,
        subject: "Verify your email address",
        html: emailMessage(user, url),
      });

      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error("Email confirmation failed", error);
    }
  }
};

export const getUsers = async (_req: AuthRequest, res: Response) => {
  const users = await User.find()
    .populate("userType", "_id name")
    .select(
      "_id firstName lastName email isAvailable reservations gender birthDate status createdBy userType",
    );
  res.send(users);
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id)
    .populate("userType", "_id name")
    .select("-password -createdBy -createdAt -updatedAt -confirmed -__t -__v");
  res.send(user);
};

export const registerCustomer = async (req: AuthRequest, res: Response) => {
  try {
    let userType = req.body.userType
      ? await UserType.findById(req.body.userType)
      : await UserType.findOne({ name: "customer" });

    if (!userType) {
      userType = await UserType.create({ name: "customer" });
    }

    req.body.userType = userType.id;
    req.body.status = "unverified";

    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User already exists");

    user = new Customer(
      _.pick(req.body, [
        "firstName",
        "lastName",
        "email",
        "birthDate",
        "gender",
        "password",
        "userType",
        "status",
      ]),
    );

    user.createdBy = {
      firstName: user.firstName,
      lastName: user.lastName,
      userType: userType.name,
    };

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    try {
      await emailConfirmation(user);
    } catch (emailError) {
      console.warn("Email confirmation skipped", emailError);
    }
    const token = (user as any).generateAuthToken();
    user = await (User as any).findUserByIdAndPopulate(user._id);
    res.header("x-auth-token", token).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unexpected error occured");
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { _id: userId } = req.user ?? {};

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let userInfo = await (User as any).findUserByIdAndPopulate(userId);
  if (!userInfo) return res.status(400).send("Invalid user.");

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already exists");

  const userType = await UserType.findById(req.body.userType);
  if (!userType) return res.status(400).send("Invalid user type.");

  try {
    const payload = _.pick(req.body, [
      "firstName",
      "lastName",
      "email",
      "birthDate",
      "gender",
      "password",
      "userType",
      "status",
    ]);

    if (userType.name === "therapist") {
      user = new Therapist(payload);
    } else if (userType.name === "customer") {
      user = new Customer(payload);
    } else {
      user = new User(payload);
    }

    user.createdBy = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      userType: userInfo.userType.name,
    };

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user = await (User as any).findUserByIdAndPopulate(user._id);
    try {
      await emailConfirmation(user);
    } catch (emailError) {
      console.warn("Email confirmation skipped", emailError);
    }
    res.send(user);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const options = {
    new: true,
    select: "_id firstName lastName email gender birthDate status",
  };
  const { error } = validateEditUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(400).send("User not found");

  const typedUser = user as any;
  if (
    (typedUser.kind || typedUser.__t) === "therapist" &&
    (typedUser.reservations?.length ?? 0) > 0 &&
    req.body.status === "suspend"
  ) {
    const name = user.firstName + " " + user.lastName;
    return res
      .status(400)
      .send(`Cant suspend ${name}'s account due to existing reservations.`);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        birthDate: req.body.birthDate,
        status: req.body.status,
      },
      options,
    ).populate("userType", "_id name");

    if (!updatedUser) return res.status(400).send("User not found");
    res.send(updatedUser);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");

  await User.deleteOne({ _id: req.params.id });
  res.send(user);
};

export const changePassword = async (req: Request, res: Response) => {
  const { error } = validatePassword(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res
      .status(400)
      .send("The current password you entered is incorrect");

  if (req.body.newPassword !== req.body.newPasswordConfirmation)
    return res.status(400).send("Password must match");

  const password = await bcrypt.hash(req.body.newPassword, 10);
  const options = {
    new: true,
    select: "_id firstName lastName email gender birthDate status",
  };

  user = await User.findByIdAndUpdate(
    req.params.id,
    {
      password,
    },
    options,
  );
  if (!user) return res.status(404).send("User not found");
  res.send(user);
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const options = {
    new: true,
    select: "_id firstName lastName email gender birthDate status",
  };

  const { error } = validateStatus(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(400).send("User not found");

  const typedUser = user as any;
  if (
    (typedUser.kind || typedUser.__t) === "therapist" &&
    (typedUser.reservations?.length ?? 0) > 0 &&
    req.body.status === "suspend"
  ) {
    const name = user.firstName + " " + user.lastName;
    return res
      .status(400)
      .send(`Cant suspend ${name}'s account due to existing reservations.`);
  } else if (
    (typedUser.kind || typedUser.__t) === "customer" &&
    req.body.status === "suspend"
  ) {
    const bookings = await Booking.find({
      "customer._id": user._id,
      status: { $in: ["pending", "ongoing"] },
    });

    if (bookings.length > 0) {
      const name = user.firstName + " " + user.lastName;
      return res
        .status(400)
        .send(`Cant suspend ${name}'s account due to existing bookings.`);
    }
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      options,
    ).populate("userType", "_id name");

    if (!updatedUser) return res.status(400).send("User not found");
    res.send(updatedUser);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};
