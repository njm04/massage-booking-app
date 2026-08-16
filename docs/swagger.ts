import swaggerUi from "swagger-ui-express";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(__dirname, "openapi.json"),
  path.resolve(__dirname, "../docs/openapi.json"),
  path.resolve(__dirname, "../../docs/openapi.json"),
  path.resolve(process.cwd(), "docs/openapi.json"),
  path.resolve(process.cwd(), "dist/docs/openapi.json"),
];

const openApiPath = candidatePaths.find((filePath) => existsSync(filePath));

if (!openApiPath) {
  throw new Error(
    "OpenAPI specification not found. Expected it in the docs folder or dist/docs folder.",
  );
}

const swaggerSpec = JSON.parse(readFileSync(openApiPath, "utf8"));

export const swaggerDocs = swaggerSpec;
export const swaggerUiMiddleware = swaggerUi;
