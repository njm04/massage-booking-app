import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import {
  changePassword,
  getCurrentUser,
  getUsers,
  registerCustomer,
} from "../../controllers/user.controller.js";
import { User } from "../../models/user.model.js";
import { Customer } from "../../models/customer.model.js";
import { UserType } from "../../models/userType.model.js";
import transporter from "../../startup/transporter.js";

describe("user controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("ignores a client-supplied userType and always registers as customer", async () => {
    const customerType = { id: "507f1f77bcf86cd799439011", name: "customer" };
    const req = {
      body: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        birthDate: "1990-01-01",
        gender: "female",
        password: "secret123",
        // Attacker-supplied field attempting privilege escalation.
        userType: "507f1f77bcf86cd799439099",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    jest.spyOn(UserType, "findOne").mockResolvedValue(customerType as any);
    jest.spyOn(User, "findOne").mockResolvedValue(null);
    jest.spyOn(Customer.prototype, "save").mockResolvedValue(undefined as any);
    jest.spyOn(transporter, "sendMail").mockResolvedValue({} as any);
    jest
      .spyOn(User as any, "findUserByIdAndPopulate")
      .mockResolvedValue({ _id: "new-user-id" });

    await registerCustomer(req, res);

    expect(UserType.findOne).toHaveBeenCalledWith({ name: "customer" });
    expect(req.body.userType).toBe("507f1f77bcf86cd799439011");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("lists users with population and selection", async () => {
    const select = jest.fn().mockImplementation(async () => [{ _id: "u1" }]);
    jest
      .spyOn(User, "find")
      .mockReturnValue({ populate: jest.fn().mockReturnThis(), select } as any);

    const res = { send: jest.fn() } as any;

    await getUsers({} as any, res);

    expect(User.find).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(
      "_id firstName lastName email isAvailable reservations gender birthDate status createdBy userType",
    );
    expect(res.send).toHaveBeenCalledWith([{ _id: "u1" }]);
  });

  it("returns the current user profile", async () => {
    const select = jest
      .fn()
      .mockImplementation(async () => ({ _id: "u1", email: "a@example.com" }));
    jest.spyOn(User, "findById").mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select,
    } as any);

    const req = { user: { _id: "u1" } } as any;
    const res = { send: jest.fn() } as any;

    await getCurrentUser(req, res);

    expect(User.findById).toHaveBeenCalledWith("u1");
    expect(select).toHaveBeenCalledWith(
      "-password -createdBy -createdAt -updatedAt -confirmed -__t -__v",
    );
    expect(res.send).toHaveBeenCalledWith({
      _id: "u1",
      email: "a@example.com",
    });
  });

  it("rejects password changes when the caller is not the resource owner", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "user-2" },
      body: {
        password: "oldpass",
        newPassword: "newpass",
        newPasswordConfirmation: "newpass",
      },
    } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
  });

  it("updates the password when ownership and current password match", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "user-1" },
      body: {
        password: "oldpass",
        newPassword: "newpass",
        newPasswordConfirmation: "newpass",
      },
    } as any;
    const res = { send: jest.fn() } as any;

    const select = jest.fn().mockImplementation(async () => ({
      _id: "user-1",
      password: "hashed",
    }));
    jest.spyOn(User, "findById").mockReturnValue({ select } as any);
    jest.spyOn(bcrypt, "compare").mockImplementation(async () => true);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("new-hash" as never);
    jest
      .spyOn(User, "findByIdAndUpdate")
      .mockResolvedValue({ _id: "user-1" } as any);

    await changePassword(req, res);

    expect(select).toHaveBeenCalledWith("+password");
    expect(bcrypt.compare).toHaveBeenCalledWith("oldpass", "hashed");
    expect(res.send).toHaveBeenCalledWith({ _id: "user-1" });
  });
});
