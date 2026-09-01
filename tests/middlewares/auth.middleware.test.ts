import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import authMiddleware from "../../middleware/auth.js";
import { User } from "../../models/user.model.js";
import { UserType } from "../../models/userType.model.js";

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

  it("rejects a token when the live user no longer exists", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "abc123" } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue(null as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("User account is not active");
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a deleted live user", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "abc123" } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "abc123",
        status: "active",
        isDeleted: true,
        userType: "u1",
      } as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an active user without a live role", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "abc123" } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "abc123",
        status: "active",
        isDeleted: false,
        userType: null,
      } as never),
    } as any);
    const findRole = jest.spyOn(UserType, "findById");

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(findRole).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an active user whose role record no longer exists", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "abc123" } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "abc123",
        status: "active",
        isDeleted: false,
        userType: "missing-role",
      } as never),
    } as any);
    jest.spyOn(UserType, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue(null as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
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
    jest.spyOn(UserType, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "u1",
        name: "customer",
      } as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(
      expect.objectContaining({
        _id: "abc123",
        userType: { _id: "u1", name: "customer" },
      }),
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses the live role when a token contains a stale elevated role", async () => {
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({
      _id: "abc123",
      userType: { _id: "admin-role", name: "admin" },
    } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "abc123",
        status: "active",
        isDeleted: false,
        userType: { _id: "customer-role" },
      } as never),
    } as any);
    jest.spyOn(UserType, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "customer-role",
        name: "customer",
      } as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(UserType.findById).toHaveBeenCalledWith("customer-role");
    expect(req.user?.userType).toEqual({
      _id: "customer-role",
      name: "customer",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("normalizes a live ObjectId role reference", async () => {
    const roleId = new mongoose.Types.ObjectId();
    const req = { header: jest.fn().mockReturnValue("token") } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "abc123" } as any);
    jest.spyOn(User, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "abc123",
        status: "active",
        isDeleted: false,
        userType: roleId,
      } as never),
    } as any);
    jest.spyOn(UserType, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: roleId,
        name: "customer",
      } as never),
    } as any);

    await authMiddleware(req, res, next);

    expect(UserType.findById).toHaveBeenCalledWith(String(roleId));
    expect(req.user?.userType).toEqual({
      _id: String(roleId),
      name: "customer",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
