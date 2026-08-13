import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "../types/express.js";
import { getConfigValue } from "../startup/env.js";
import { User } from "../models/user.model.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  const secret = getConfigValue("jwtPrivateKey", "booking_jwtPrivateKey");
  if (!secret) return res.status(400).send("Invalid token");

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    const user = await User.findById(decoded._id).select(
      "_id status isDeleted userType",
    );

    if (!user || user.isDeleted || user.status === "suspend") {
      return res.status(401).send("User account is not active");
    }

    req.user = {
      ...decoded,
      userType:
        decoded.userType ??
        (typeof user.userType === "string" || user.userType == null
          ? user.userType
          : { _id: String(user.userType), name: undefined }),
    };
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
};
