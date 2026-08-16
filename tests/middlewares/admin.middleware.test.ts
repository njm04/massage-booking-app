import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import adminMiddleware from "../../middleware/admin.js";
import { UserType } from "../../models/userType.model.js";

describe("admin middleware", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("allows admin users", async () => {
    const req = { user: { userType: { _id: "u1" } } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ name: "admin" } as any);

    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects non-admin users", async () => {
    const req = { user: { userType: { _id: "u1" } } } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    jest
      .spyOn(UserType, "findById")
      .mockResolvedValue({ name: "customer" } as any);

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests without a user type", async () => {
    const req = { user: {} } as any;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const next = jest.fn();

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied");
    expect(next).not.toHaveBeenCalled();
  });
});
