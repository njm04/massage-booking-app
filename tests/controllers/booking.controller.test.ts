import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { Booking } from "../../models/booking.model.js";
import { Therapist } from "../../models/therapist.model.js";
import { Customer } from "../../models/customer.model.js";
import { User } from "../../models/user.model.js";
import transporter from "../../startup/transporter.js";
import {
  createBooking,
  deleteBooking,
  getBookingForUpdate,
  getBookings,
  updateBooking,
  updateBookingStatus,
} from "../../controllers/booking.controller.js";

describe("booking controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a booking for a valid customer request", async () => {
    const bookingSave = jest.fn();
    const req = {
      user: {
        _id: "u1",
        userType: { _id: "t1", name: "customer" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439011",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(User, "findById").mockResolvedValue({
      _id: "u1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    } as any);
    jest.spyOn(Therapist, "findById").mockResolvedValue({
      _id: "therapist-1",
      firstName: "Sam",
      lastName: "Lee",
      addReservation: jest.fn(),
    } as any);
    jest.spyOn(Customer, "findById").mockResolvedValue({
      _id: "u1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    } as any);
    jest.spyOn(transporter, "sendMail").mockResolvedValue({} as any);

    const bookingCtor = jest
      .spyOn(Booking.prototype, "save")
      .mockImplementation(bookingSave as any);
    jest.spyOn(mongoose, "startSession").mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    } as any);
    await createBooking(req, res);

    expect(Therapist.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(bookingCtor).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it("allows an admin to create a booking for a customer", async () => {
    const req = {
      user: {
        _id: "admin-1",
        userType: { _id: "admin-role", name: "admin" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439011",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const addReservation = jest.fn();

    jest.spyOn(User, "findById").mockResolvedValue({
      _id: "admin-1",
      firstName: "Ada",
      lastName: "Admin",
      email: "admin@example.com",
    } as any);
    jest.spyOn(Therapist, "findById").mockResolvedValue({
      _id: "therapist-1",
      firstName: "Sam",
      lastName: "Lee",
      addReservation,
    } as any);
    jest.spyOn(Customer, "findOne").mockResolvedValue({
      _id: "customer-1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    } as any);
    jest.spyOn(Booking.prototype, "save").mockResolvedValue(undefined as any);
    jest.spyOn(transporter, "sendMail").mockResolvedValue({} as any);
    jest.spyOn(mongoose, "startSession").mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    } as any);

    await createBooking(req, res);

    expect(Customer.findOne).toHaveBeenCalledWith({
      email: "jane@example.com",
    });
    expect(addReservation).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({}));
  });

  it("does not allow a therapist to create a customer booking", async () => {
    const req = {
      user: {
        _id: "therapist-1",
        userType: { _id: "therapist-role", name: "therapist" },
      },
      body: {},
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const findUser = jest.spyOn(User, "findById");

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(findUser).not.toHaveBeenCalled();
  });

  it("returns bookings based on the user role", async () => {
    const find = jest.fn().mockImplementation(async () => [{ _id: "b1" }]);
    jest.spyOn(Booking, "find").mockImplementation(find as any);

    const req = { user: { userType: { name: "customer" }, _id: "u1" } } as any;
    const res = { send: jest.fn() } as any;

    await getBookings(req, res);

    expect(Booking.find).toHaveBeenCalledWith({
      isDeleted: false,
      "customer._id": "u1",
    });
    expect(res.send).toHaveBeenCalledWith([{ _id: "b1" }]);
  });

  it("updates booking status to a non-completed value", async () => {
    const req = {
      params: { id: "b1" },
      body: { status: "pending" },
      user: {
        _id: "therapist-1",
        userType: { _id: "therapist-role", name: "therapist" },
      },
    } as any;
    const res = { send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue({ _id: "b1" } as any);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue({ _id: "b1", status: "pending" } as any);

    await updateBookingStatus(req, res);

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "b1",
        isDeleted: false,
        "therapist._id": "therapist-1",
      },
      { status: "pending" },
      { new: true },
    );
    expect(res.send).toHaveBeenCalledWith({ _id: "b1", status: "pending" });
  });

  it("does not allow therapists to cancel bookings", async () => {
    const booking = {
      _id: "b1",
      date: new Date(Date.now() + 48 * 60 * 60 * 1000),
      customer: { email: "customer@example.com" },
    };
    const req = {
      params: { id: "b1" },
      user: { _id: "therapist-1", userType: { name: "therapist" } },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(booking as any);
    const update = jest.spyOn(Booking, "findOneAndUpdate");

    await deleteBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      "Therapists cannot cancel customer appointments",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("does not allow customers to cancel within 24 hours", async () => {
    const booking = {
      _id: "b1",
      date: new Date(Date.now() + 23 * 60 * 60 * 1000),
      customer: { _id: "customer-1", email: "customer@example.com" },
    };
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-1",
        email: "customer@example.com",
        userType: { name: "customer" },
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(booking as any);
    const update = jest.spyOn(Booking, "findOneAndUpdate");

    await deleteBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      "Customers can only cancel appointments 24 hours in advance",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("allows customers to cancel their booking at least 24 hours ahead", async () => {
    const booking = {
      _id: "b1",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000),
      customer: { _id: "customer-1", email: "customer@example.com" },
      therapist: { _id: "therapist-1" },
    };
    const cancelledBooking = { ...booking, status: "cancelled" };
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-1",
        email: "CUSTOMER@example.com",
        userType: { name: "customer" },
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(booking as any);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue(cancelledBooking as any);
    jest.spyOn(Therapist, "updateOne").mockResolvedValue({} as any);

    await deleteBooking(req, res);

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "b1",
        isDeleted: false,
        "customer._id": "customer-1",
      },
      { status: "cancelled" },
      { new: true },
    );
    expect(res.send).toHaveBeenCalledWith(cancelledBooking);
  });

  it("allows admins to cancel at any time", async () => {
    const booking = {
      _id: "b1",
      date: new Date(Date.now() + 60 * 60 * 1000),
      therapist: { _id: "therapist-1" },
    };
    const deletedBooking = { ...booking, isDeleted: true };
    const req = {
      params: { id: "b1" },
      user: { _id: "admin-1", userType: { name: "admin" } },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(booking as any);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue(deletedBooking as any);
    jest.spyOn(Therapist, "updateOne").mockResolvedValue({} as any);

    await deleteBooking(req, res);

    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "b1", isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    expect(res.send).toHaveBeenCalledWith(deletedBooking);
  });

  it("does not reveal another customer's booking during cancellation", async () => {
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-2",
        userType: { _id: "customer-role", name: "customer" },
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(null);
    const update = jest.spyOn(Booking, "findOneAndUpdate");

    await deleteBooking(req, res);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: "b1",
      isDeleted: false,
      "customer._id": "customer-2",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Booking not found");
    expect(update).not.toHaveBeenCalled();
  });

  it("does not allow a customer to update another customer's booking", async () => {
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-2",
        userType: { _id: "customer-role", name: "customer" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439011",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(null);
    const update = jest.spyOn(Booking, "findOneAndUpdate");

    await updateBooking(req, res);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: "b1",
      isDeleted: false,
      "customer._id": "customer-2",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("does not allow an assigned therapist to use the full booking edit route", async () => {
    const req = {
      params: { id: "b1" },
      user: {
        _id: "therapist-1",
        userType: { _id: "therapist-role", name: "therapist" },
      },
      body: {},
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const find = jest.spyOn(Booking, "findOne");

    await updateBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(find).not.toHaveBeenCalled();
  });

  it("allows a customer to edit their booking without changing therapists", async () => {
    const appointment = {
      _id: "b1",
      customer: { firstName: "Jane", lastName: "Doe" },
      therapist: { _id: "507f1f77bcf86cd799439011" },
    };
    const therapist = { reservations: [], save: jest.fn() };
    const updatedBooking = { ...appointment, massageType: "Swedish" };
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-1",
        userType: { _id: "customer-role", name: "customer" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439011",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(appointment as any);
    jest.spyOn(Therapist, "findById").mockResolvedValue(therapist as any);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue(updatedBooking as any);

    await updateBooking(req, res);

    expect(Therapist.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
    );
    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "b1",
        isDeleted: false,
        "customer._id": "customer-1",
      },
      expect.not.objectContaining({ therapist: expect.anything() }),
      { new: true },
    );
    expect(res.send).toHaveBeenCalledWith(updatedBooking);
  });

  it("derives the previous therapist from the stored booking during customer reassignment", async () => {
    const appointment = {
      _id: "b1",
      customer: { firstName: "Jane", lastName: "Doe" },
      therapist: { _id: "507f1f77bcf86cd799439011" },
    };
    const storedTherapist = { removeReservation: jest.fn() };
    const newTherapist = {
      _id: "507f1f77bcf86cd799439022",
      firstName: "Alex",
      lastName: "Smith",
      addReservation: jest.fn(),
    };
    const req = {
      params: { id: "b1" },
      user: {
        _id: "customer-1",
        userType: { _id: "customer-role", name: "customer" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439022",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(appointment as any);
    jest
      .spyOn(Therapist, "findById")
      .mockResolvedValueOnce(newTherapist as never)
      .mockResolvedValueOnce(storedTherapist as never);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue({ _id: "b1" } as any);

    await updateBooking(req, res);

    expect(Therapist.findById).toHaveBeenNthCalledWith(
      1,
      "507f1f77bcf86cd799439022",
    );
    expect(Therapist.findById).toHaveBeenNthCalledWith(
      2,
      "507f1f77bcf86cd799439011",
    );
    expect(storedTherapist.removeReservation).toHaveBeenCalledWith("b1");
    expect(newTherapist.addReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "b1",
        massageType: "Swedish",
        duration: 60,
      }),
    );
  });

  it("allows admins to edit any booking", async () => {
    const appointment = {
      _id: "b1",
      customer: { firstName: "Jane", lastName: "Doe" },
      therapist: { _id: "507f1f77bcf86cd799439011" },
    };
    const req = {
      params: { id: "b1" },
      user: {
        _id: "admin-1",
        userType: { _id: "admin-role", name: "admin" },
      },
      body: {
        therapist: "507f1f77bcf86cd799439011",
        massageType: "Swedish",
        duration: 60,
        contactNumber: "1234567890",
        address: "Street",
        state: "NY",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        addressTwo: "Apt 1",
        city: "NYC",
        zip: "100011",
        date: "2026-01-01T12:00:00.000Z",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(appointment as any);
    jest
      .spyOn(Therapist, "findById")
      .mockResolvedValue({ reservations: [], save: jest.fn() } as any);
    jest
      .spyOn(Booking, "findOneAndUpdate")
      .mockResolvedValue({ _id: "b1" } as any);

    await updateBooking(req, res);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: "b1",
      isDeleted: false,
    });
    expect(res.send).toHaveBeenCalledWith({ _id: "b1" });
  });

  it("allows customers and admins to read bookings in their scope", async () => {
    const booking = { _id: "b1" };
    const customerReq = {
      params: { id: "b1" },
      user: {
        _id: "customer-1",
        userType: { name: "customer" },
      },
    } as any;
    const adminReq = {
      params: { id: "b1" },
      user: { _id: "admin-1", userType: { name: "admin" } },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const find = jest.spyOn(Booking, "findOne").mockResolvedValue(booking as any);

    await getBookingForUpdate(customerReq, res);
    await getBookingForUpdate(adminReq, res);

    expect(find).toHaveBeenNthCalledWith(1, {
      _id: "b1",
      isDeleted: false,
      "customer._id": "customer-1",
    });
    expect(find).toHaveBeenNthCalledWith(2, {
      _id: "b1",
      isDeleted: false,
    });
    expect(res.send).toHaveBeenCalledTimes(2);
  });

  it("does not reveal another customer's booking in the update view", async () => {
    const req = {
      params: { id: "b1" },
      user: { _id: "customer-2", userType: { name: "customer" } },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    jest.spyOn(Booking, "findOne").mockResolvedValue(null);

    await getBookingForUpdate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Booking not found");
  });

  it("does not allow a therapist to update another therapist's booking status", async () => {
    const req = {
      params: { id: "b1" },
      body: { status: "ongoing" },
      user: {
        _id: "therapist-2",
        userType: { _id: "therapist-role", name: "therapist" },
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(Booking, "findOne").mockResolvedValue(null);
    const update = jest.spyOn(Booking, "findOneAndUpdate");

    await updateBookingStatus(req, res);

    expect(Booking.findOne).toHaveBeenCalledWith({
      _id: "b1",
      isDeleted: false,
      "therapist._id": "therapist-2",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(update).not.toHaveBeenCalled();
  });
});
