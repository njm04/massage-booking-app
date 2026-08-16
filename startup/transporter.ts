import nodemailer from "nodemailer";
import { getConfigValue } from "./env.js";

export default nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: getConfigValue("email", "booking_email"),
    pass: getConfigValue("password", "booking_emailPassword"),
  },
} as any);
