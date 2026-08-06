import { UserType } from "../models/userType.model.js";

export default async (req, res, next) => {
  const type = await UserType.findById(req.user.userType);
  if (type.name !== "therapist") return res.status(403).send("Access denied");

  next();
};
