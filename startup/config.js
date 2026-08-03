import winston from "winston";
import { getConfigValue } from "./env.js";

export default () => {
  const required = [
    ["jwtPrivateKey", "booking_jwtPrivateKey"],
    ["ATLAS_DB", "booking_ATLAS_DB"],
    ["email", "booking_email"],
    ["password", "booking_emailPassword"],
    ["EMAIL_SECRET", "booking_emailSecret"],
  ];

  for (const [key, envKey] of required) {
    const value = getConfigValue(key, envKey);
    if (!value) {
      winston.warn(`Configuration value '${envKey}' is not set; continuing without it.`);
    }
  }
};
