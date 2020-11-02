const { UserType } = require("../models/userType.model");

module.exports = async (req, res, next) => {
  const type = await UserType.findById(req.user.userType);
  if (type.name !== "admin") return res.status(403).send("Access denied");

  next();
};
