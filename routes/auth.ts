import express from "express";
import { ipKeyGenerator } from "express-rate-limit";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { login, confirmEmail } from "../controllers/auth.controller.js";

const router = express.Router();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
  keyGenerator: (req) => {
    const clientKey = ipKeyGenerator(req.ip ?? "unknown");
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "unknown";

    return `${clientKey}:${email}`;
  },
});

router.post("/", authRateLimiter, login);
router.get("/confirmation/:token", confirmEmail);

export default router;
