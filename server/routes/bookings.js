const express = require("express");
const jwt = require("jsonwebtoken");
const Fawn = require("fawn");
const Joi = require("joi");
const mongoose = require("mongoose");
const { Booking, validate } = require("../models/booking.model");
// const verifyToken = require("../utils/verifyToken");
const auth = require("../middleware/auth");
const therapist = require("../middleware/therapist");
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

  const { error } = validate(req.body, req.user);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(userId);
  if (!user) return res.status(400).send("Invalid user.");

  const { therapist: therapistId } = req.body;
  const therapist = await User.findById(therapistId);
  if (!therapist) return res.status(400).send("Therapist not found.");

  const userType = await UserType.findById(userTypeId);
  if (!userType) return res.status(400).send("Invalid user type.");

  const booking = new Booking({
    createdBy: {
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
    customer: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.user.userType.name === "admin" ? req.body.email : user.email,
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
      name: `${booking.customer.firstName} ${booking.customer.lastName}`,
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
      isDeleted: false,
    });
  } else if (userType.name === UserTypesEnum.CUSTOMER) {
    bookings = await Booking.find({
      isDeleted: false,
      "createdBy._id": userId,
    });
  } else {
    bookings = await Booking.find({
      isDeleted: false,
      "therapist._id": userId,
    });
  }

  return res.send(bookings);
});

router.put("/:id", [auth, validateObjectId], async (req, res) => {
  let payload = {};
  let reservation = {};

  const { error } = validate(req.body, req.user);
  if (error) return res.status(400).send(error.details[0].message);

  const appointment = await Booking.findById(req.params.id);
  if (!appointment) return res.status(400).send("Appointment not found");

  if (req.body.prevTherapist) {
    const prevTherapist = await User.findById(req.body.prevTherapist);
    if (!prevTherapist) return res.status(400).send("Therapist not found.");
    prevTherapist.reservations.pull(req.params.id);
    await prevTherapist.save();

    const newTherapist = await User.findById(req.body.therapist);
    if (!newTherapist) return res.status(400).send("Therapist not found.");
    payload = {
      therapist: {
        _id: newTherapist._id,
        firstName: newTherapist.firstName,
        lastName: newTherapist.lastName,
      },
      customer: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
      },
      massageType: req.body.massageType,
      duration: req.body.duration,
      date: req.body.date,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      addressTwo: req.body.addressTwo,
      state: req.body.state,
      city: req.body.city,
      zip: req.body.zip,
    };

    reservation = {
      _id: appointment._id,
      massageType: appointment.massageType,
      name: `${appointment.createdBy.firstName} ${appointment.createdBy.lastName}`,
      duration: appointment.duration,
      date: appointment.date,
    };

    newTherapist.reservations.push(reservation);
    await newTherapist.save();
  } else {
    payload = {
      customer: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
      },
      massageType: req.body.massageType,
      duration: req.body.duration,
      date: req.body.date,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      addressTwo: req.body.addressTwo,
      state: req.body.state,
      city: req.body.city,
      zip: req.body.zip,
    };

    // why does model.update queries doesnt work????
    let therapist = await User.findById(req.body.therapist);
    if (!therapist) return res.status(400).send("Therapist not found.");

    const reservation = therapist.reservations.id(req.params.id);
    reservation.duration = req.body.duration;
    reservation.date = req.body.date;

    await therapist.save();
  }

  const options = { new: true };
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    payload,
    options
  );

  if (!booking) return res.status(400).send("Booking not found");

  res.send(booking);
});

router.put("/delete/:id", [auth, validateObjectId], async (req, res) => {
  const options = { new: true };
  const { userType } = req.user;
  let booking;

  if (userType.name === "customer") {
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      options
    );
  } else {
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      options
    );
  }

  const therapist = await User.findById(booking.therapist._id);
  if (!therapist) return res.status(400).send("Therapist not found.");
  therapist.reservations.pull(req.params.id);
  await therapist.save();

  if (!booking) return res.status(400).send("Booking not found");

  res.send(booking);
});

router.get("/update-view/:id", [auth, validateObjectId], async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: 0 });
  if (!booking) return res.status(400).send("Booking not found");

  res.send(booking);
});

router.put(
  "/update-status/:id",
  [auth, therapist, validateObjectId],
  async (req, res) => {
    const { error } = validateStatus(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(400).send("Appointment not found");

    try {
      if (req.body.status !== "completed") {
        const options = { new: true };
        booking = await Booking.findByIdAndUpdate(
          req.params.id,
          { status: req.body.status },
          options
        );
        if (!booking) return res.status(400).send("Appointment not found");
        res.send(booking);
      } else {
        await new Fawn.Task()
          .update(
            "bookings",
            { _id: booking._id },
            { status: req.body.status },
            { new: true }
          )
          .update(
            "users",
            { _id: booking.therapist._id },
            { $pull: { reservations: { _id: booking._id } } }
          )
          .run();

        booking = await Booking.findById(req.params.id);
        res.send(booking);
      }
    } catch (error) {
      res.status(500).send("Unexpected error occured");
    }
  }
);

const validateStatus = (req) => {
  const schema = {
    status: Joi.string().required(),
  };

  return Joi.validate(req, schema);
};

module.exports = router;
