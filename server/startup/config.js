const config = require("config");

module.exports = () => {
  if (!config.get("jwtPrivateKey")) {
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined");
  }

  if (!config.get("ATLAS_DB")) {
    throw new Error("FATAL ERROR: ATLAS_DB is not defined");
  }
};
