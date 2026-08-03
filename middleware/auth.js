import jwt from "jsonwebtoken";
import { getConfigValue } from "../startup/env.js";

export default (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, getConfigValue("jwtPrivateKey", "booking_jwtPrivateKey"));

    console.log(decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
};
