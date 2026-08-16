import type { NextFunction, Request, Response } from "express";
import { UserType } from "../models/userType.model.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  const userType = req.user?.userType;
  const userTypeId =
    typeof userType === "object" && userType !== null ? userType._id : userType;

  if (!userTypeId) {
    return res.status(403).send("Access denied");
  }

  const type = await UserType.findById(userTypeId);
  if (!type || type.name !== "admin")
    return res.status(403).send("Access denied");

  next();
};
