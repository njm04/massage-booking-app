const nodemailer = require("nodemailer");
const config = require("config");

module.exports = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.get("email"),
    pass: config.get("password"),
  },
});
