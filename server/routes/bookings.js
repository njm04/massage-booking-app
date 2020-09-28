const express = require("express");
const jwt = require("jsonwebtoken");
const { Booking, validate } = require("../models/booking.model");
// const verifyToken = require("../utils/verifyToken");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

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

router.get("/", auth, async (req, res) => {
  const { userType } = req.user;
  let bookings = await Booking.find({ isDeleted: 0, userType }).populate(
    "bookedBy",
    "-_id firstName lastName"
  );

  bookings = bookings.map((booking) => {
    return {
      id: booking._id,
      name: booking.bookedBy.firstName + " " + booking.bookedBy.lastName,
      massageType: booking.massageType,
      duration: booking.duration,
      contactNumber: booking.contactNumber,
      address: booking.address + ", " + booking.city + ", " + booking.zip,
      date: new Date(booking.date).toLocaleString(),
    };
  });

  return res.send(bookings);
});

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    isDeleted: 0,
  }).populate("bookedBy", "-_id firstName lastName");
  if (!booking) return res.status(404).send("Booking not found");

  res.send(booking);
});

router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const options = { new: true };
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      massageType: req.body.massageType,
      duration: req.body.duration,
      date: req.body.date,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      city: req.body.city,
      zip: req.body.zip,
    },
    options
  );

  if (!booking) return res.status(404).send("Booking not found");

  res.send(booking);
});

router.put("/delete/:id", [auth, validateObjectId], async (req, res) => {
  const options = { new: true };

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { isDeleted: 1 },
    options
  );
  if (!booking) return res.status(404).send("Booking not found");

  res.send(booking);
});

router.get("/update-view/:id", [auth, validateObjectId], async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: 0 });
  if (!booking) return res.status(404).send("Booking not found");

  res.send(booking);
});

module.exports = router;
