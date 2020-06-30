const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { User, validate } = require("../models/user.model");
const auth = require("../middleware/auth");
const router = express.Router();

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
      _.pick(req.body, ["firstName", "lastName", "email", "age", "password"])
    );
    user.password = await bcrypt.hash(user.password, 10);

    await user.save();
    const token = user.generateAuthToken();

    res
      .header("x-auth-token", token)
      .send(_.pick(user, ["_id", "firstName", "lastName", "email", "age"]));
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

module.exports = router;
