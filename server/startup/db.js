const mongoose = require("mongoose");
const winston = require("winston");
const config = require("config");

module.exports = () => {
  const db = config.get("ATLAS_DB");
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => winston.info(`Connected to MongoDB...`));
};
