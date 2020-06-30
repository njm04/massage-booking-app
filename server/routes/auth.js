const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const { User } = require("../models/user.model");
const router = express.Router();

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid password or email");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid password or email");

  const token = user.generateAuthToken();

  res.send(token);
});

const validate = (req) => {
  const schema = {
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(4).max(1000).required(),
  };

  return Joi.validate(req, schema);
};

module.exports = router;
