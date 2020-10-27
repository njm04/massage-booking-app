const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const _ = require("lodash");
const { User, validate } = require("../models/user.model");
const { Therapist } = require("../models/therapist.model");
const { UserType } = require("../models/userType.model");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
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
  if (!req.body.userType) {
    const userType = await UserType.findOne({ name: "customer" });
    req.body.userType = userType.id;
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
      ])
    );

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    const token = user.generateAuthToken();

    res
      .header("x-auth-token", token)
      .send(
        _.pick(user, [
          "_id",
          "firstName",
          "lastName",
          "email",
          "birthDate",
          "gender",
          "userType",
        ])
      );
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.post("/create-user", [auth, admin], async (req, res) => {
  const { userType: userTypeId, _id: userId } = req.user;

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const userInfo = await User.findById(userId);
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

    const creatorInfo = _.pick(userInfo, [
      "firstName",
      "lastName",
      "email",
      "userType",
    ]);

    payload.createdBy = creatorInfo;

    if (userType.name === "therapist") {
      user = new Therapist(payload);
    } else {
      user = new User(payload);
    }

    user.password = await bcrypt.hash(user.password, 10);
    await user.save();

    res.send(
      _.pick(user, [
        "_id",
        "firstName",
        "lastName",
        "birthDate",
        "gender",
        "email",
        "age",
        "status",
        "userType",
        "createdBy",
      ])
    );
  } catch (error) {
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
  res.send(user._id);
});

router.put(
  "/change-password/:id",
  [auth, validateObjectId],
  async (req, res) => {
    const { error } = validatePassword(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const password = await bcrypt.hash(req.body.password, 10);
    const options = { new: true, select: "_id email updatedAt" };
    const user = await User.findByIdAndUpdate(
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

const validateStatus = (req) => {
  const schema = {
    isDeleted: Joi.boolean().required(),
  };

  return Joi.validate(req, schema);
};

const validatePassword = (req) => {
  const schema = {
    password: Joi.string().min(5).max(1000).required(),
  };

  return Joi.validate(req, schema);
};

module.exports = router;
