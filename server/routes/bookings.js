const express = require("express");
const jwt = require("jsonwebtoken");
const Fawn = require("fawn");
const mongoose = require("mongoose");
const { Booking, validate } = require("../models/booking.model");
// const verifyToken = require("../utils/verifyToken");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const { User } = require("../models/user.model");
const { Therapist } = require("../models/therapist.model");
const { UserType } = require("../models/userType.model");

const router = express.Router();
const secret_key = process.env.SECRET_KEY;

const UserTypesEnum = Object.freeze({
  ADMIN: "admin",
  THERAPIST: "therapist",
  CUSTOMER: "customer",
});

Fawn.init(mongoose);

router.post("/", auth, async (req, res) => {
  const { userType: userTypeId, _id: userId } = req.user;

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(userId);
  if (!user) return res.status(400).send("Invalid user.");

  const { therapist: therapistId } = req.body;
  const therapist = await User.findById(therapistId);
  if (!therapist) return res.status(400).send("Therapist not found.");

  const userType = await UserType.findById(userTypeId);
  if (!userType) return res.status(400).send("Invalid user type.");

  const booking = new Booking({
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: { _id: userType._id, name: userType.name },
    },
    therapist: {
      _id: therapist._id,
      firstName: therapist.firstName,
      lastName: therapist.lastName,
    },
    massageType: req.body.massageType,
    duration: req.body.duration,
    contactNumber: req.body.contactNumber,
    address: req.body.address,
    state: req.body.state,
    addressTwo: req.body.addressTwo,
    city: req.body.city,
    zip: req.body.zip,
    date: req.body.date,
  });

  try {
    const reservation = {
      _id: booking._id,
      massageType: booking.massageType,
      name: `${booking.user.firstName} ${booking.user.lastName}`,
      duration: booking.duration,
      date: booking.date,
    };

    new Fawn.Task()
      .save("bookings", booking)
      .update(
        "users",
        { _id: therapist._id },
        {
          isAvailable: false,
          $push: { reservations: reservation },
        }
      )
      .run();

    // await booking.save();
    res.send(booking);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
});

router.get("/", [auth], async (req, res) => {
  let bookings = [];

  const { userType: userTypeId, _id: userId } = req.user;

  const userType = await UserType.findById(userTypeId);
  if (!userType) return res.status(400).send("Invalid user type.");

  if (userType.name === UserTypesEnum.ADMIN) {
    bookings = await Booking.find({
      isDeleted: 0,
    });
  } else if (userType.name === UserTypesEnum.CUSTOMER) {
    bookings = await Booking.find({
      isDeleted: 0,
      "user._id": userId,
    });
  }

  bookings = bookings.map((booking) => {
    return {
      id: booking._id,
      name: booking.user.firstName + " " + booking.user.lastName,
      massageType: booking.massageType,
      duration: booking.duration,
      contactNumber: booking.contactNumber,
      address: concatAddress(booking),
      date: new Date(booking.date).toLocaleString(),
    };
  });

  return res.send(bookings);
});

const concatAddress = (obj) => {
  const addressTwo = obj.addressTwo ? obj.addressTwo + " " : "";
  return `${addressTwo}${obj.address}, ${obj.city}, ${obj.state}, ${obj.zip}`;
};

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
