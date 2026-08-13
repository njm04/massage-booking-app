import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../../middleware/auth.js";
import { User } from "../../models/user.model.js";

describe("auth middleware", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.booking_jwtPrivateKey = "test-secret";
  });

  it("rejects a missing token", async () => {
    const req = { header: jest.fn().mockReturnValue(undefined) } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("Access denied. No token provided.");
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a suspended user", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({
      _id: "abc123",
      email: "test@example.com",
      userType: { _id: "u1", name: "customer" },
    } as any);

    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockImplementation(async () => ({
        _id: "abc123",
        status: "suspend",
        isDeleted: false,
        userType: "u1",
      })),
    } as any);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("User account is not active");
    expect(next).not.toHaveBeenCalled();
  });

  it("loads req.user and calls next for an active account", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({
      _id: "abc123",
      email: "test@example.com",
      userType: { _id: "u1", name: "customer" },
    } as any);

    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockImplementation(async () => ({
        _id: "abc123",
        status: "active",
        isDeleted: false,
        userType: "u1",
      })),
    } as any);

    await authMiddleware(req, res, next);

    expect(req.user?._id).toBe("abc123");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
