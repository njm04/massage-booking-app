const express = require("express");
const winston = require("winston");
// loads environment variables from a .env file into process.env
require("dotenv").config();

const app = express();
require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  winston.info(`Server is running on port: ${PORT}`)
);

module.exports = server;
