import express from "express";
import { getTherapists } from "../controllers/therapist.controller.js";
import auth from "../middleware/auth.js";
import requireRoles from "../middleware/requireRoles.js";

const router = express.Router();

router.get(
  "/",
  [auth, requireRoles("admin", "customer", "therapist")],
  getTherapists,
);

export default router;
