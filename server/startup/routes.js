const express = require("express");
const cors = require("cors");
const users = require("../routes/users");
const auth = require("../routes/auth");
const bookings = require("../routes/bookings");
const error = require("../middleware/error");

module.exports = (app) => {
  app.use(express.json());
  app.use(cors());
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/bookings", bookings);
  app.use(error);
};
