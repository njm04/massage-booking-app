const express = require("express");
var path = require("path");
const cors = require("cors");
var exphbs = require("express-handlebars");
const users = require("../routes/users");
const auth = require("../routes/auth");
const bookings = require("../routes/bookings");
const userTypes = require("../routes/userTypes");
const error = require("../middleware/error");

const corsOptions = {
  exposedHeaders: "x-auth-token",
};
module.exports = (app) => {
  app.engine(
    "handlebars",
    exphbs({
      defaultLayout: "main",
    })
  );
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "handlebars");
  app.use(express.json());
  app.use(cors(corsOptions));
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/bookings", bookings);
  app.use("/api/user-types", userTypes);
  app.use(error);
};
