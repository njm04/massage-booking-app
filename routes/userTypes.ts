import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  getUserTypes,
  createUserType,
} from "../controllers/userType.controller.js";

const router = express.Router();

router.get("/", [auth, admin], getUserTypes);
router.post("/", [auth, admin], createUserType);

export default router;
