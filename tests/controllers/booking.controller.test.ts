import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { Booking } from "../../models/booking.model.js";
import { UserType } from "../../models/userType.model.js";
import { Therapist } from "../../models/therapist.model.js";
import { Customer } from "../../models/customer.model.js";
import { User } from "../../models/user.model.js";
import transporter from "../../startup/transporter.js";
import {
  createBooking,
  deleteBooking,
  getBookings,
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
    } as any);
    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ _id: "t1", name: "customer" } as any);
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
    jest.spyOn(Therapist, "updateOne").mockResolvedValue({} as any);

    await createBooking(req, res);

    expect(Therapist.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(bookingCtor).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it("returns bookings based on the user role", async () => {
    const find = jest.fn().mockImplementation(async () => [{ _id: "b1" }]);
    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ name: "customer" } as any);
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
    const req = { params: { id: "b1" }, body: { status: "pending" } } as any;
    const res = { send: jest.fn() } as any;

    jest.spyOn(Booking, "findById").mockResolvedValue({ _id: "b1" } as any);
    jest
      .spyOn(Booking, "findByIdAndUpdate")
      .mockResolvedValue({ _id: "b1", status: "pending" } as any);

    await updateBookingStatus(req, res);

    expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
      "b1",
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
    const update = jest.spyOn(Booking, "findByIdAndUpdate");

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
      customer: { email: "customer@example.com" },
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
    const update = jest.spyOn(Booking, "findByIdAndUpdate");

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
      customer: { email: "customer@example.com" },
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
      .spyOn(Booking, "findByIdAndUpdate")
      .mockResolvedValue(cancelledBooking as any);
    jest.spyOn(Therapist, "updateOne").mockResolvedValue({} as any);

    await deleteBooking(req, res);

    expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
      "b1",
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
      .spyOn(Booking, "findByIdAndUpdate")
      .mockResolvedValue(deletedBooking as any);
    jest.spyOn(Therapist, "updateOne").mockResolvedValue({} as any);

    await deleteBooking(req, res);

    expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
      "b1",
      { isDeleted: true },
      { new: true },
    );
    expect(res.send).toHaveBeenCalledWith(deletedBooking);
  });
});
