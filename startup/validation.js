const Joi = require("Joi");

module.exports = () => {
  Joi.objectId = require("joi-objectid")(Joi);
};
