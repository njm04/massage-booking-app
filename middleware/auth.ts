import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "../types/express.js";
import { getConfigValue } from "../startup/env.js";
import { User } from "../models/user.model.js";
import { UserType } from "../models/userType.model.js";

const getUserTypeId = (userType: unknown): string | undefined => {
  if (typeof userType === "string") return userType;
  if (userType === null || typeof userType !== "object") return undefined;

  if ("_id" in userType && userType._id) return String(userType._id);
  return String(userType);
};

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

    const liveUserTypeId = getUserTypeId(user.userType);
    const liveUserType = liveUserTypeId
      ? await UserType.findById(liveUserTypeId).select("_id name")
      : null;

    if (!liveUserType) {
      return res.status(401).send("User account is not active");
    }

    req.user = {
      ...decoded,
      userType: {
        _id: String(liveUserType._id),
        name: liveUserType.name,
      },
    };
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
};
