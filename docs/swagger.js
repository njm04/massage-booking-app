import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerSpec = JSON.parse(readFileSync(path.join(__dirname, "openapi.json"), "utf8"));

export const swaggerDocs = swaggerSpec;
export const swaggerUiMiddleware = swaggerUi;
