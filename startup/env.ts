import dotenv from "dotenv";
import config from "config";

dotenv.config();

export const getConfigValue = (
  configKey: string,
  envKey?: string,
): string | undefined => {
  const directEnv = envKey ? process.env[envKey] : undefined;
  if (directEnv) return directEnv;

  const fallbackEnv = process.env[configKey];
  if (fallbackEnv) return fallbackEnv;

  try {
    const value = config.get(configKey);
    if (typeof value === "string") return value;
    if (value != null) return String(value);
    return undefined;
  } catch {
    return undefined;
  }
};

export default getConfigValue;
