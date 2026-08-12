import Joi from "joi";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { Booking, validate } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";
import { UserType } from "../models/userType.model.js";
import { Therapist } from "../models/therapist.model.js";
import transporter from "../startup/transporter.js";

const UserTypesEnum = Object.freeze({
  ADMIN: "admin",
  THERAPIST: "therapist",
  CUSTOMER: "customer",
});

const validateStatus = (req) => {
  const schema = Joi.object({
    status: Joi.string().required(),
  });

  return schema.validate(req);
};

const emailMessage = (booking) => {
  const style = "margin-bottom: 20px";
  return `
  <p style="${style}">Hi ${booking.customer.firstName} ${
    booking.customer.lastName
  }!</p>
  <p style="${style}">You have successfully reserved appointment! Please see the appointment details below.</p>

  <h2 style="${style}">Appointment details:</h2> 
  <p><strong>When: </strong>${dayjs(booking.date).format(
    "MMMM D YYYY, h:mm A",
  )}</p> 
  <p><strong>Massage type: </strong>${booking.massageType}</p> 
  <p><strong>Duration: </strong>${booking.duration} minutes</p> 
  <p style="${style}"><strong>Massage therapist: </strong>${
    booking.therapist.firstName
  } ${booking.therapist.lastName}</p> 

  <p style="${style}">Please come 15 minutes before your scheduled appointment.</p>
  <p style="${style}">Thank you for choosing us.</p>
  `;
};

export const createBooking = async (req, res) => {
  const {
    userType: { _id: userTypeId },
    _id: userId,
  } = req.user;
  const { error } = validate(req.body, req.user);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findById(userId);
  if (!user) return res.status(400).send("Invalid user.");

  const { therapist: therapistId } = req.body;
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) return res.status(400).send("Therapist not found.");

  const userType = await UserType.findById(userTypeId);
  if (!userType) return res.status(400).send("Invalid user type.");

  const customer =
    userType.name === "admin"
      ? await Customer.findOne({ email: req.body.email })
      : await Customer.findById(user._id);
  if (!customer) return res.status(400).send("Customer not found.");

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
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = {
      _id: booking._id,
      massageType: booking.massageType,
      name: `${customer.firstName} ${customer.lastName}`,
      duration: booking.duration,
      date: booking.date,
    };

    await booking.save({ session });

    await Therapist.updateOne(
      { _id: therapist._id },
      {
        isAvailable: false,
        $push: { reservations: reservation },
      },
      { session },
    );

    await session.commitTransaction();

    transporter.sendMail({
      to: booking.customer.email,
      subject: "Appointment Details",
      html: emailMessage(booking),
    });
    res.send(booking);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).send("Unexpected error occured");
  } finally {
    session.endSession();
  }
};

export const getBookings = async (req, res) => {
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
      "customer._id": userId,
    });
  } else {
    bookings = await Booking.find({
      isDeleted: false,
      "therapist._id": userId,
    });
  }

  return res.send(bookings);
};

export const updateBooking = async (req, res) => {
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

    let therapist = await User.findById(req.body.therapist);
    if (!therapist) return res.status(400).send("Therapist not found.");

    const reservationItem = therapist.reservations.id(req.params.id);
    reservationItem.duration = req.body.duration;
    reservationItem.date = req.body.date;

    await therapist.save();
  }

  const options = { new: true };
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    payload,
    options,
  );

  if (!booking) return res.status(400).send("Booking not found");

  res.send(booking);
};

export const deleteBooking = async (req, res) => {
  const options = { new: true };
  const { userType } = req.user;
  let booking;
  try {
    if (userType.name === "customer") {
      booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: "cancelled" },
        options,
      );
    } else {
      booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true },
        options,
      );
    }

    if (!booking) return res.status(400).send("Booking not found");

    await Therapist.updateOne(
      { _id: booking.therapist._id },
      { $pull: { reservations: { _id: booking._id } } },
    );

    res.send(booking);
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};

export const getBookingForUpdate = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: 0 });
  if (!booking) return res.status(400).send("Booking not found");

  res.send(booking);
};

export const updateBookingStatus = async (req, res) => {
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
        options,
      );
      if (!booking) return res.status(400).send("Appointment not found");
      res.send(booking);
    } else {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Booking.updateOne(
          { _id: booking._id },
          { status: req.body.status },
          { session },
        );
        await User.updateOne(
          { _id: booking.therapist._id },
          { $pull: { reservations: { _id: booking._id } } },
          { session },
        );
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      booking = await Booking.findById(req.params.id);
      res.send(booking);
    }
  } catch (error) {
    res.status(500).send("Unexpected error occured");
  }
};
