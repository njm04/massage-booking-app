import mongoose from "mongoose";
import winston from "winston";
import { getConfigValue } from "./env.js";

const getDbUri = () => getConfigValue("ATLAS_DB", "booking_ATLAS_DB");

export default async () => {
  const db = getDbUri();
  if (!db) {
    winston.warn("MongoDB connection string is not configured; skipping database connection.");
    return;
  }

  try {
    await mongoose.connect(db);
    winston.info("Connected to MongoDB...");
  } catch (error) {
    winston.error("MongoDB connection failed", error);
  }
};
