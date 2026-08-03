import dotenv from "dotenv";
import config from "config";

dotenv.config();

export const getConfigValue = (configKey, envKey) => {
  const directEnv = envKey ? process.env[envKey] : undefined;
  if (directEnv) return directEnv;

  const fallbackEnv = process.env[configKey];
  if (fallbackEnv) return fallbackEnv;

  try {
    return config.get(configKey);
  } catch {
    return undefined;
  }
};

export default getConfigValue;
