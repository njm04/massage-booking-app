import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import {
  getUsers,
  getCurrentUser,
  registerCustomer,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  updateUserStatus,
} from "../controllers/user.controller.js";

const router = express.Router();

const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
});

router.get("/", [auth, admin], getUsers);
router.get("/me", auth, getCurrentUser);
router.post("/", registerRateLimiter, registerCustomer);
router.post("/create-user", [auth, admin], createUser);
router.put("/:id", [auth, admin, validateObjectId], updateUser);
router.delete("/:id", [auth, admin, validateObjectId], deleteUser);
router.put("/change-password/:id", [auth, validateObjectId], changePassword);
router.put(
  "/update-status/:id",
  [auth, admin, validateObjectId],
  updateUserStatus,
);

export default router;
