import express from "express";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { login, confirmEmail } from "../controllers/auth.controller.js";

const router = express.Router();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

router.use(authRateLimiter);
router.post("/", login);
router.get("/confirmation/:token", confirmEmail);

export default router;
