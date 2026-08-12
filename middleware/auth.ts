import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "../types/express.js";
import { getConfigValue } from "../startup/env.js";

export default (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  const secret = getConfigValue("jwtPrivateKey", "booking_jwtPrivateKey");
  if (!secret) return res.status(400).send("Invalid token");

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;

    console.log(decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
};
