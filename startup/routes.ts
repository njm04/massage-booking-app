import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { create } from "express-handlebars";
import users from "../routes/users.js";
import auth from "../routes/auth.js";
import bookings from "../routes/bookings.js";
import userTypes from "../routes/userTypes.js";
import error from "../middleware/error.js";
import { swaggerDocs, swaggerUiMiddleware } from "../docs/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  exposedHeaders: "x-auth-token",
};

export default (app: express.Express) => {
  const hbs = create({
    defaultLayout: "main",
  });

  app.engine("handlebars", hbs.engine);
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "handlebars");
  app.use(express.json());
  app.use(cors(corsOptions));
  app.use(
    "/api-docs",
    swaggerUiMiddleware.serve,
    swaggerUiMiddleware.setup(swaggerDocs),
  );
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/bookings", bookings);
  app.use("/api/user-types", userTypes);
  app.use(error);
};
