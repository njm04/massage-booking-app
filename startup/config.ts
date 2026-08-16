import winston from "winston";
import { getConfigValue } from "./env.js";

export default () => {
  const required: Array<[string, string]> = [
    ["jwtPrivateKey", "booking_jwtPrivateKey"],
    ["ATLAS_DB", "booking_ATLAS_DB"],
    ["email", "booking_email"],
    ["password", "booking_emailPassword"],
    ["EMAIL_SECRET", "booking_emailSecret"],
  ];

  const missing = required.filter(
    ([key, envKey]) => !getConfigValue(key, envKey),
  );

  if (process.env.NODE_ENV === "production" && missing.length > 0) {
    const names = missing.map(([, envKey]) => envKey).join(", ");
    throw new Error(
      `Missing required production configuration: ${names}. Set the environment variables before starting the app.`,
    );
  }

  for (const [, envKey] of missing) {
    winston.warn(
      `Configuration value '${envKey}' is not set; continuing without it.`,
    );
  }
};
