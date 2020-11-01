const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const { User, validate } = require("../models/user.model");
const { Therapist } = require("../models/therapist.model");
const { UserType } = require("../models/userType.model");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const transporter = require("../startup/transporter");
const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.find()
    .populate("userType", "_id name")
    .select(
      "_id firstName lastName email isAvailable reservations gender birthDate status"
    );
  res.send(users);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  let userType;
  if (!req.body.userType) {
    userType = await UserType.findOne({ name: "customer" });
    req.body.userType = userType.id;
    req.body.status = "active";
  }

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already exists");

  try {
    user = new User(
      _.pick(req.body, [
        "firstName",
        "lastName",
        "email",
        "birthDate",
        "gender",
        "password",
        "userType",
        "status",
      ])
    );

    user.createdBy = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: { _id: userType._id, name: userType.name },
    };

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    emailConfirmation(user);
    const token = user.generateAuthToken();
    user = await User.findUserByIdAndPopulate(user._id);
    res.header("x-auth-token", token).send(user);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.post("/create-user", [auth, admin], async (req, res) => {
  const { _id: userId } = req.user;

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let userInfo = await User.findUserByIdAndPopulate(userId);
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
    } else {
      user = new User(payload);
    }

    user.createdBy = {
      _id: userInfo._id,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      userType: { _id: userInfo.userType._id, name: userInfo.userType.name },
    };

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user = await User.findUserByIdAndPopulate(user._id);
    console.log(user);
    emailConfirmation(user);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send("Unexpected error occured");
  }
});

router.put("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const options = {
    new: true,
    select: "_id firstName lastName email gender birthDate status",
  };
  const { error } = validateEditUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(400).send("User not found");

  if (
    user.__t === "therapist" &&
    user.reservations.length > 0 &&
    req.body.status === "suspend"
  ) {
    const name = user.firstName + " " + user.lastName;
    return res
      .status(400)
      .send(`Cant suspend ${name}'s account due to existing reservations.`);
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        birthDate: req.body.birthDate,
        status: req.body.status,
      },
      options
    ).populate("userType", "_id name");

    if (!user) return res.status(400).send("User not found");
    res.send(user);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");

  await User.deleteOne({ _id: req.params.id });
  res.send(user);
});

router.put(
  "/change-password/:id",
  [auth, validateObjectId],
  async (req, res) => {
    const { error } = validatePassword(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
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
      options
    );
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  }
);

const validateEditUser = (req) => {
  const schema = {
    email: Joi.string().min(5).max(255).email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    birthDate: Joi.date().required(),
    gender: Joi.string().required(),
    status: Joi.string().required(),
  };

  return Joi.validate(req, schema);
};

const validatePassword = (req) => {
  const schema = {
    password: Joi.string().min(5).max(1000).required(),
    newPassword: Joi.string().min(5).max(1000).required(),
    newPasswordConfirmation: Joi.string().min(5).max(1000).required(),
  };

  return Joi.validate(req, schema);
};

const emailConfirmation = (user) => {
  if (user.userType.name === "customer") {
    jwt.sign(
      { user: _.pick(user, "_id") },
      config.get("EMAIL_SECRET"),
      { expiresIn: "1d" },
      (error, emailToken) => {
        if (!error) {
          const url = `http://localhost:5000/api/auth/confirmation/${emailToken}`;

          transporter.sendMail({
            to: user.email,
            subject: "Verify your email address",
            html: emailMessage(user, url),
          });
        }
      }
    );
  }
};

const emailMessage = (user, url) => {
  const style = "margin-bottom: 20px";
  return `
  <p style="${style}">Hi ${user.firstName} ${user.lastName}!</p>
  <p style="${style}">Welcome to THE MASSAGE CLINIC. To verify your email so that you can access your account and start making appointments, click the following link:</p> 
  <p style="${style}"><a href="${url}">${url}</a></p>
  <p style="${style}">Thank you for choosing us.</p>
  `;
};

module.exports = router;
