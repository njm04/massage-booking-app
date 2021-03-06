const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { Customer } = require("../models/customer.model");
const router = express.Router();

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email })
    .populate("userType")
    .select("_id name password firstName lastName status confirmed");

  if (!user) return res.status(400).send("Invalid password or email");
  if (!user.confirmed && user.userType.name === "customer")
    return res.status(400).send("Please verify your email.");
  if (user.status === "suspend")
    return res.status(400).send("Account has been suspended");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid password or email");

  const token = user.generateAuthToken();
  res.send(token);
});

router.get("/confirmation/:token", async (req, res) => {
  try {
    const {
      user: { _id },
    } = jwt.verify(req.params.token, config.get("EMAIL_SECRET"));

    const user = await Customer.findById(_id);
    if (user.confirmed) {
      res.render("emailConfirmed");
    } else {
      await Customer.updateOne(
        { _id: user._id },
        { confirmed: true, status: "active" }
      );
      res.redirect(config.get("CONFIRMED_URI"));
    }
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

const validate = (req) => {
  const schema = {
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(4).max(1000).required(),
  };

  return Joi.validate(req, schema);
};

module.exports = router;
