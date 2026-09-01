import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { create } from "express-handlebars";
import users from "../routes/users.js";
import auth from "../routes/auth.js";
import bookings from "../routes/bookings.js";
import userTypes from "../routes/userTypes.js";
import therapists from "../routes/therapists.js";
import error from "../middleware/error.js";
import { swaggerDocs, swaggerUiMiddleware } from "../docs/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  exposedHeaders: ["x-auth-token"],
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

  if (process.env.NODE_ENV !== "production") {
    app.use(
      "/api-docs",
      swaggerUiMiddleware.serve,
      swaggerUiMiddleware.setup(swaggerDocs),
    );
  }

  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/bookings", bookings);
  app.use("/api/user-types", userTypes);
  app.use("/api/therapists", therapists);
  app.use(error);
};
