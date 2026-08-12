import type { NextFunction, Request, Response } from "express";
import { UserType } from "../models/userType.model.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  const type = await UserType.findById(req.user?.userType);
  if (!type || type.name !== "admin")
    return res.status(403).send("Access denied");

  next();
};
