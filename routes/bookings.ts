import express from "express";
import auth from "../middleware/auth.js";
import therapist from "../middleware/therapist.js";
import validateObjectId from "../middleware/validateObjectId.js";
import admin from "../middleware/admin.js";
import {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  getBookingForUpdate,
  updateBookingStatus,
  getTodaysBookings,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/", [auth], getBookings);
router.put("/:id", [auth, validateObjectId], updateBooking);
router.put("/delete/:id", [auth, validateObjectId], deleteBooking);
router.get("/update-view/:id", [auth, validateObjectId], getBookingForUpdate);
router.get("/today", [auth, admin], getTodaysBookings);
router.put(
  "/update-status/:id",
  [auth, therapist, validateObjectId],
  updateBookingStatus,
);

export default router;
