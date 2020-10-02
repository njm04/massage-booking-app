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
    .select("_id firstName lastName email isAvailable");
  res.send(users);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
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
        "age",
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
          "age",
          "userType",
        ])
      );
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.post("/register-therapist", auth, async (req, res) => {
  const { userType: userTypeId, _id: userId } = req.user;

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const userInfo = await User.findById(userId);
  if (!userInfo) return res.status(400).send("Invalid user.");

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already exists");

  const userType = await UserType.findById(userTypeId);
  if (!userType) return res.status(400).send("Invalid user type.");
  try {
    const payload = _.pick(req.body, [
      "firstName",
      "lastName",
      "email",
      "age",
      "password",
      "userType",
    ]);
    const creatorInfo = _.pick(userInfo, [
      "firstName",
      "lastName",
      "email",
      "userType",
    ]);

    payload.createdBy = creatorInfo;

    user = new Therapist(payload);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();

    res.send(
      _.pick(user, [
        "_id",
        "firstName",
        "lastName",
        "email",
        "age",
        "isAvailable",
        "userType",
        "createdBy",
      ])
    );
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.put("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const { error } = validateStatus(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const options = { new: true, select: "_id email isDeleted" };
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: req.body.isDeleted,
    },
    options
  );

  if (!user) return res.status(404).send("User not found");
  res.send(user);
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
