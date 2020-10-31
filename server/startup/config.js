const config = require("config");

module.exports = () => {
  if (!config.get("jwtPrivateKey")) {
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined");
  }

  if (!config.get("ATLAS_DB")) {
    throw new Error("FATAL ERROR: ATLAS_DB is not defined");
  }

  if (!config.get("email")) {
    throw new Error("FATAL ERROR: email is not defined");
  }

  if (!config.get("password")) {
    throw new Error("FATAL ERROR: email password is not defined");
  }

  if (!config.get("EMAIL_SECRET")) {
    throw new Error("FATAL ERROR: EMAIL_SECRET is not defined");
  }
};
