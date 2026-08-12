import express from "express";
import { login, confirmEmail } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", login);
router.get("/confirmation/:token", confirmEmail);

export default router;
