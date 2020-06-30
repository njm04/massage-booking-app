const express = require("express");
const jwt = require("jsonwebtoken");
const { Booking, validate } = require("../models/booking.model");
const verifyToken = require("../utils/verifyToken");
const auth = require("../middleware/auth");

const router = express.Router();
const secret_key = process.env.SECRET_KEY;

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const booking = new Booking({
    bookedBy: req.user._id,
    massageType: req.body.massageType,
    duration: req.body.duration,
    contactNumber: req.body.contactNumber,
    address: req.body.address,
    city: req.body.city,
    zip: req.body.zip,
    date: req.body.date,
  });

  await booking.save();
  res.send(booking);
});

router.get("/", async (req, res) => {
  const booking = await Booking.find({ isDeleted: 0 }).populate(
    "bookedBy",
    "-_id firstName lastName"
  );
  return res.send(booking);
});

//TODO: Refactor the remaining endpoints
router.get("/:id", verifyToken, async (req, res) => {
  const userId = req.params.id;
  jwt.verify(req.token, secret_key, async (err) => {
    if (err) {
      return res.json({ status: 403, message: "Unauthorized" });
    } else {
      await Booking.where({ isDeleted: 0 })
        .where({ bookedBy: userId })
        .find()
        .populate("bookedBy", "_id firstName lastName")
        .exec((err, user) => {
          if (err) return res.status(500);
          return res.json(user);
        });
    }
  });
});

router.put("/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, secret_key, async (err) => {
    if (err) {
      return res.json({ status: 403, message: "Unauthorized" });
    } else {
      const massageType = req.body.massageType;
      const duration = req.body.duration;
      const date = req.body.date;
      const contactNumber = req.body.contactNumber;
      const address = req.body.address;
      const city = req.body.city;
      const zip = req.body.zipCode;
      const booking = await Booking.findById(req.params.id);
      if (booking !== null) {
        const updatedBooking = await Booking.updateOne(
          { _id: req.params.id },
          {
            massageType: massageType,
            duration: duration,
            date: date,
            contactNumber: contactNumber,
            address: address,
            city: city,
            zip: zip,
          }
        );

        return res.json({
          status: 200,
          data: updatedBooking,
          message: "Successfully updated.",
        });
      } else {
        return res.json({ status: 500, message: "Booking not found." });
      }
    }
  });
});

router.put("/delete/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, secret_key, async (err) => {
    if (err) {
      return res.json({ status: 403, message: "Unauthorized" });
    } else {
      const booking = await Booking.where({ isDeleted: 0 }).findOne({
        _id: req.params.id,
      });
      if (booking !== null) {
        await booking.updateOne({ isDeleted: 1 });
        return res.json({ status: 200, message: "Successfully deleted" });
      }
      return res.json({ status: 500, message: "Booking not found." });
    }
  });
});

router.get("/update/view/:id", verifyToken, async (req, res) => {
  jwt.verify(req.token, secret_key, async (err) => {
    if (err) {
      return res.json({ status: 403, message: "Unauthorized" });
    } else {
      const booking = await Booking.where({ isDeleted: 0 }).findOne({
        _id: req.params.id,
      });
      if (booking !== null) {
        return res.json({ status: 200, data: booking, message: "Retrieved" });
      }
      return res.json({ status: 500, message: "Booking not found." });
    }
  });
});

module.exports = router;
