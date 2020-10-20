const express = require("express");
const cors = require("cors");
const users = require("../routes/users");
const auth = require("../routes/auth");
const bookings = require("../routes/bookings");
const userTypes = require("../routes/userTypes");
const error = require("../middleware/error");

const corsOptions = {
  exposedHeaders: "x-auth-token",
};
module.exports = (app) => {
  app.use(express.json());
  app.use(cors(corsOptions));
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/bookings", bookings);
  app.use("/api/user-types", userTypes);
  app.use(error);
};
