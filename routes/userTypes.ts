import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserTypes,
  createUserType,
} from "../controllers/userType.controller.js";

const router = express.Router();

router.get("/", auth, getUserTypes);
router.post("/", auth, createUserType);

export default router;
